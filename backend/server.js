import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db.js';
import { runCoordinatorAgent, getPurchaseRecommendations, translateTeluguToEnglish, translateEnglishToTelugu, scanBillAndPopulate } from './agent.js';
import { generatePDF, generateExcel, generateShoppingListPDF } from './reports.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Increase JSON limit to handle base64 image uploads
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Helper to normalize and translate English/Telugu item names
async function normalizeNames(english_name, telugu_name) {
  let finalEnglish = (english_name || '').trim();
  let finalTelugu = (telugu_name || '').trim();

  const teluguUnicodeRegex = /[\u0c00-\u0c7f]/;
  const originalEnglishMissing = !finalEnglish;

  // 1. If telugu_name contains no Telugu script (e.g. transliterated 'bellam' or English 'sugar'), translate to Telugu script
  if (finalTelugu && !teluguUnicodeRegex.test(finalTelugu)) {
    console.log(`[Server] Translating transliterated/English telugu_name: '${finalTelugu}' to Telugu script`);
    const translated = await translateEnglishToTelugu(finalTelugu);
    if (teluguUnicodeRegex.test(translated)) {
      finalTelugu = translated;
    }
  }

  // 2. If english_name was missing (either originally or now), translate telugu_name to English
  if (originalEnglishMissing && finalTelugu) {
    console.log(`[Server] Translating telugu_name to English: ${finalTelugu}`);
    finalEnglish = await translateTeluguToEnglish(finalTelugu);
  }

  // 3. If telugu_name is missing, translate english_name to Telugu
  if (!finalTelugu && finalEnglish) {
    console.log(`[Server] Translating english_name to Telugu: ${finalEnglish}`);
    finalTelugu = await translateEnglishToTelugu(finalEnglish);
  }

  return {
    english_name: finalEnglish || finalTelugu,
    telugu_name: finalTelugu || finalEnglish
  };
}

// ----------------------------------------------------
// INVENTORY ENDPOINTS
// ----------------------------------------------------

app.get('/api/inventory', async (req, res) => {
  try {
    const items = await db.all("SELECT * FROM items ORDER BY english_name ASC");
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/inventory', async (req, res) => {
  let { english_name, telugu_name, quantity, unit, threshold, category, price } = req.body;
  
  if (!english_name && !telugu_name) {
    return res.status(400).json({ error: "Missing required fields: english_name or telugu_name must be provided" });
  }
  if (!unit || quantity === undefined) {
    return res.status(400).json({ error: "Missing required fields: unit, quantity" });
  }

  try {
    const normalized = await normalizeNames(english_name, telugu_name);
    english_name = normalized.english_name;
    telugu_name = normalized.telugu_name;

    // Check if the item already exists (case-insensitive)
    const existing = await db.get(
      "SELECT * FROM items WHERE LOWER(english_name) = ? OR LOWER(telugu_name) = ?",
      [english_name.toLowerCase(), (telugu_name || english_name).toLowerCase()]
    );

    if (existing) {
      console.log(`[Server] Item already exists. Merging with existing item: ${existing.english_name} (ID: ${existing.id})`);
      const newQty = existing.quantity + quantity;
      
      await db.run(
        `UPDATE items 
         SET quantity = ?, threshold = ?, price = ?, category = ?, telugu_name = ?, unit = ?
         WHERE id = ?`,
        [newQty, threshold !== undefined ? threshold : existing.threshold, price || existing.price, category || existing.category, telugu_name || existing.telugu_name, unit, existing.id]
      );

      if (newQty < (threshold || existing.threshold)) {
        const neededQty = (threshold || existing.threshold) - newQty;
        await db.run(
          `INSERT INTO shopping_list (item_id, quantity) VALUES (?, ?)
           ON CONFLICT(item_id) DO UPDATE SET quantity = ?`,
          [existing.id, neededQty, neededQty]
        );
      } else {
        await db.run("DELETE FROM shopping_list WHERE item_id = ? AND status = 'pending'", [existing.id]);
      }

      const updatedItem = await db.get("SELECT * FROM items WHERE id = ?", [existing.id]);
      return res.status(200).json(updatedItem);
    }

    const result = await db.run(
      `INSERT INTO items (english_name, telugu_name, quantity, unit, threshold, category, price) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [english_name, telugu_name || english_name, quantity, unit, threshold || 0, category || 'Groceries', price || 0]
    );

    const newItem = await db.get("SELECT * FROM items WHERE id = ?", [result.lastID]);

    if (quantity < (threshold || 0)) {
      const neededQty = (threshold || 0) - quantity;
      await db.run(
        "INSERT OR IGNORE INTO shopping_list (item_id, quantity) VALUES (?, ?)",
        [newItem.id, neededQty]
      );
    }

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  let { quantity, threshold, price, category, english_name, telugu_name, unit } = req.body;

  try {
    const item = await db.get("SELECT * FROM items WHERE id = ?", [id]);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const normalized = await normalizeNames(english_name, telugu_name);
    english_name = normalized.english_name;
    telugu_name = normalized.telugu_name;

    const updatedQty = quantity !== undefined ? quantity : item.quantity;
    const updatedThreshold = threshold !== undefined ? threshold : item.threshold;
    const updatedPrice = price !== undefined ? price : item.price;
    const updatedCategory = category || item.category;
    const updatedEnglish = english_name || item.english_name;
    const updatedTelugu = telugu_name || item.telugu_name;
    const updatedUnit = unit || item.unit;

    await db.run(
      `UPDATE items 
       SET quantity = ?, threshold = ?, price = ?, category = ?, english_name = ?, telugu_name = ?, unit = ?
       WHERE id = ?`,
      [updatedQty, updatedThreshold, updatedPrice, updatedCategory, updatedEnglish, updatedTelugu, updatedUnit, id]
    );

    if (updatedQty < updatedThreshold) {
      const neededQty = updatedThreshold - updatedQty;
      await db.run(
        `INSERT INTO shopping_list (item_id, quantity) VALUES (?, ?)
         ON CONFLICT(item_id) DO UPDATE SET quantity = ?`,
        [id, neededQty, neededQty]
      );
    } else {
      await db.run("DELETE FROM shopping_list WHERE item_id = ? AND status = 'pending'", [id]);
    }

    const updatedItem = await db.get("SELECT * FROM items WHERE id = ?", [id]);
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.run("DELETE FROM items WHERE id = ?", [id]);
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// SHOPPING LIST ENDPOINTS
// ----------------------------------------------------

app.get('/api/shopping-list', async (req, res) => {
  try {
    const list = await db.all(`
      SELECT sl.*, i.english_name, i.telugu_name, i.unit, i.category, i.price
      FROM shopping_list sl
      JOIN items i ON sl.item_id = i.id
      WHERE sl.status = 'pending'
    `);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shopping-list', async (req, res) => {
  const { item_id, quantity } = req.body;
  if (!item_id || !quantity) {
    return res.status(400).json({ error: "Missing required fields: item_id, quantity" });
  }

  try {
    await db.run(
      `INSERT INTO shopping_list (item_id, quantity) VALUES (?, ?)
       ON CONFLICT(item_id) DO UPDATE SET quantity = quantity + ?`,
      [item_id, quantity, quantity]
    );

    const updated = await db.get(`
      SELECT sl.*, i.english_name, i.telugu_name, i.unit
      FROM shopping_list sl
      JOIN items i ON sl.item_id = i.id
      WHERE sl.item_id = ? AND sl.status = 'pending'
    `, [item_id]);

    res.status(201).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shopping-list/purchase', async (req, res) => {
  const { item_id, quantity, price_per_unit } = req.body;
  if (!item_id || !quantity || price_per_unit === undefined) {
    return res.status(400).json({ error: "Missing item_id, quantity, or price_per_unit" });
  }

  try {
    const item = await db.get("SELECT * FROM items WHERE id = ?", [item_id]);
    if (!item) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    const total_price = quantity * price_per_unit;
    const today = new Date().toISOString();

    await db.run(
      `INSERT INTO purchase_history (item_id, quantity, price_per_unit, total_price, purchase_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [item_id, quantity, price_per_unit, total_price, today]
    );

    const newQuantity = item.quantity + quantity;
    await db.run(
      "UPDATE items SET quantity = ?, price = ? WHERE id = ?",
      [newQuantity, price_per_unit, item_id]
    );

    await db.run("DELETE FROM shopping_list WHERE item_id = ?", [item_id]);

    res.json({
      success: true,
      message: `Purchased ${quantity} ${item.unit} of ${item.english_name}. Stock is now ${newQuantity} ${item.unit}.`,
      updatedQuantity: newQuantity
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/shopping-list/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  if (!quantity) {
    return res.status(400).json({ error: "Missing required quantity field" });
  }

  try {
    await db.run("UPDATE shopping_list SET quantity = ? WHERE id = ?", [quantity, id]);
    res.json({ success: true, message: "Shopping list item quantity updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/shopping-list/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.run("DELETE FROM shopping_list WHERE id = ?", [id]);
    res.json({ success: true, message: "Shopping list item deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// ANALYTICS & RECOMMENDATION ENDPOINTS
// ----------------------------------------------------

app.get('/api/analytics', async (req, res) => {
  try {
    const monthlyExpenses = await db.all(`
      SELECT strftime('%Y-%m', purchase_date) as month, SUM(total_price) as total
      FROM purchase_history
      GROUP BY month
      ORDER BY month ASC
      LIMIT 6
    `);

    const topItems = await db.all(`
      SELECT i.english_name as name, i.telugu_name as teluguName, SUM(ph.total_price) as value
      FROM purchase_history ph
      JOIN items i ON ph.item_id = i.id
      GROUP BY ph.item_id
      ORDER BY value DESC
      LIMIT 5
    `);

    const categoryExpenses = await db.all(`
      SELECT i.category, SUM(ph.total_price) as value
      FROM purchase_history ph
      JOIN items i ON ph.item_id = i.id
      GROUP BY i.category
    `);

    res.json({
      monthlyExpenses,
      topItems,
      categoryExpenses
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/recommendations', async (req, res) => {
  try {
    const recs = await getPurchaseRecommendations();
    res.json(recs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/purchase-history', async (req, res) => {
  try {
    const history = await db.all(`
      SELECT ph.*, i.english_name, i.telugu_name, i.unit, i.category
      FROM purchase_history ph
      JOIN items i ON ph.item_id = i.id
      ORDER BY ph.purchase_date DESC
      LIMIT 10
    `);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// MULTI-AGENT AI & OCR BILL SCANNER ENDPOINTS
// ----------------------------------------------------

app.post('/api/agent', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing required text command" });
  }

  try {
    const result = await runCoordinatorAgent(text);
    res.json(result);
  } catch (error) {
    console.error('Coordinator Agent handler crash:', error);
    res.status(500).json({ error: error.message });
  }
});

// OCR Grocery Bill Receipt Scanner Endpoint (Multimodal AI)
app.post('/api/agent/scan-bill', async (req, res) => {
  const { image, mimeType, billDate } = req.body;
  if (!image) {
    return res.status(400).json({ error: "Missing image payload for receipt scan" });
  }

  try {
    // Strip image format header prefix (e.g. data:image/jpeg;base64,) if present
    let base64Data = image;
    if (image.includes(';base64,')) {
      base64Data = image.split(';base64,')[1];
    }

    const type = mimeType || 'image/jpeg';
    console.log(`[Server] Received OCR receipt scan request. MimeType: ${type}, billDate: ${billDate}`);

    const result = await scanBillAndPopulate(base64Data, type, billDate);
    res.json(result);
  } catch (error) {
    console.error('[Server] OCR scan handler failed:', error);
    res.status(500).json({ error: error.message });
  }
});


// ----------------------------------------------------
// REPORTS DOWNLOAD ENDPOINTS
// ----------------------------------------------------

app.get('/api/reports/shopping-list/download', async (req, res) => {
  try {
    const pdfBuffer = await generateShoppingListPDF();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Shopping_List.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).send(`Error generating report: ${error.message}`);
  }
});

app.get('/api/reports/download', async (req, res) => {
  const { month, format } = req.query;
  if (!month || !format) {
    return res.status(400).send("Parameters 'month' and 'format' are required.");
  }

  try {
    if (format === 'pdf') {
      const pdfBuffer = await generatePDF(month);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${month}_Report.pdf"`);
      res.send(pdfBuffer);
    } else if (format === 'excel') {
      const excelBuffer = await generateExcel(month);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${month}_Report.xlsx"`);
      res.send(excelBuffer);
    } else {
      res.status(400).send("Format must be 'pdf' or 'excel'");
    }
  } catch (error) {
    res.status(500).send(`Error generating report: ${error.message}`);
  }
});

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
