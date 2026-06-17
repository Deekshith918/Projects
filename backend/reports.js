import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import db from './db.js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_FONT_PATH = path.resolve(__dirname, 'NotoSansTelugu-Regular.ttf');

// Auto-download Noto Sans Telugu font from Google Fonts repo if not present locally
async function downloadTeluguFont() {
  if (fs.existsSync(LOCAL_FONT_PATH)) {
    return true;
  }

  console.log('[PDF Generator] Local NotoSansTelugu.ttf not found. Downloading from Google Fonts...');
  const url = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanstelugu/NotoSansTelugu-Regular.ttf';

  return new Promise((resolve) => {
    const file = fs.createWriteStream(LOCAL_FONT_PATH);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('[PDF Generator] NotoSansTelugu.ttf downloaded successfully!');
          resolve(true);
        });
      } else {
        console.error(`[PDF Generator] Failed to download font. Status code: ${response.statusCode}`);
        file.close();
        fs.unlink(LOCAL_FONT_PATH, () => {}); // delete partial file
        resolve(false);
      }
    }).on('error', (err) => {
      console.error('[PDF Generator] Font download error:', err.message);
      file.close();
      fs.unlink(LOCAL_FONT_PATH, () => {});
      resolve(false);
    });
  });
}

// Helper to determine if a Telugu font is available and register it
async function setupPdfFont(doc) {
  // Try local font first (will trigger download)
  await downloadTeluguFont();
  if (fs.existsSync(LOCAL_FONT_PATH)) {
    try {
      doc.registerFont('TeluguFont', LOCAL_FONT_PATH);
      return true;
    } catch (e) {
      console.error('[PDF Generator] Failed to register local Telugu font:', e.message);
    }
  }

  // Fallback system fonts if download failed
  const fontPaths = [
    'C:\\Windows\\Fonts\\Nirmala.ttf',
    'C:\\Windows\\Fonts\\gautami.ttf',
    'C:\\Windows\\Fonts\\Gautami.ttf'
  ];

  for (const path of fontPaths) {
    try {
      if (fs.existsSync(path)) {
        doc.registerFont('TeluguFont', path);
        console.log(`[PDF Generator] Registered fallback system font: ${path}`);
        return true;
      }
    } catch (err) {
      console.warn(`[PDF Generator] Failed to check system font at ${path}:`, err.message);
    }
  }
  return false;
}

// Generate PDF Report
export async function generatePDF(month) {
  const query = `
    SELECT ph.*, i.english_name, i.telugu_name, i.unit 
    FROM purchase_history ph
    JOIN items i ON ph.item_id = i.id
    WHERE strftime('%Y-%m', ph.purchase_date) = ?
    ORDER BY ph.purchase_date DESC
  `;
  const purchases = await db.all(query, [month]);

  const doc = new PDFDocument({ margin: 50 });

  return new Promise(async (resolve, reject) => {
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', reject);

    // Setup Telugu font support
    const hasTeluguFont = await setupPdfFont(doc);

    // Header / Branding
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#1e3a8a').text('Smart Telugu Household Inventory', { align: 'center' });
    doc.font('Helvetica').fontSize(14).fillColor('#4b5563').text(`Monthly Grocery Report - ${month}`, { align: 'center' });
    doc.moveDown(2);

    // Summary Box
    const totalExpense = purchases.reduce((sum, p) => sum + p.total_price, 0);
    const tableTopStartY = doc.y;
    doc.rect(50, tableTopStartY, 512, 60).fill('#f3f4f6');
    
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(12).text(`Total Purchased Items: ${purchases.length}`, 70, tableTopStartY + 20);
    doc.fontSize(14).fillColor('#16a34a').text(`Total Expenses: Rs. ${totalExpense.toFixed(2)}`, 320, tableTopStartY + 20, { align: 'right', width: 220 });
    
    doc.y = tableTopStartY + 80;

    // Table Header
    const tableTop = doc.y;
    doc.fillColor('#1e3a8a').font('Helvetica-Bold').fontSize(11);
    doc.text('Date', 50, tableTop);
    if (hasTeluguFont) {
      doc.font('Helvetica-Bold').text('Item (English / ', 130, tableTop, { continued: true })
         .font('TeluguFont').text('సరుకు పేరు', { continued: true })
         .font('Helvetica-Bold').text(')');
    } else {
      doc.font('Helvetica-Bold').text('Item (English / Telugu)', 130, tableTop);
    }
    doc.font('Helvetica-Bold').text('Qty', 330, tableTop, { width: 50, align: 'right' });
    doc.font('Helvetica-Bold').text('Rate', 390, tableTop, { width: 55, align: 'right' });
    doc.font('Helvetica-Bold').text('Total', 470, tableTop, { width: 80, align: 'right' });

    doc.moveTo(50, tableTop + 15).lineTo(562, tableTop + 15).strokeColor('#e5e7eb').stroke();

    // Table Rows
    let currentY = tableTop + 25;
    
    purchases.forEach((p) => {
      const dateStr = p.purchase_date ? p.purchase_date.split('T')[0] : '';
      doc.fillColor('#374151').font('Helvetica').fontSize(10).text(dateStr, 50, currentY);
      
      if (hasTeluguFont && p.telugu_name && p.telugu_name !== p.english_name) {
        doc.fillColor('#374151').font('Helvetica').fontSize(10).text(`${p.english_name} / `, 130, currentY, { continued: true })
           .font('TeluguFont').text(p.telugu_name);
      } else {
        doc.fillColor('#374151').font('Helvetica').fontSize(10).text(p.english_name, 130, currentY);
      }

      doc.fillColor('#374151').font('Helvetica').fontSize(10).text(`${p.quantity} ${p.unit}`, 330, currentY, { width: 50, align: 'right' });
      doc.fillColor('#374151').font('Helvetica').fontSize(10).text(`Rs. ${p.price_per_unit}`, 390, currentY, { width: 55, align: 'right' });
      doc.fillColor('#374151').font('Helvetica').fontSize(10).text(`Rs. ${p.total_price}`, 470, currentY, { width: 80, align: 'right' });

      currentY += 20;

      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
    });

    doc.end();
  });
}

// Generate Excel Report
export async function generateExcel(month) {
  const query = `
    SELECT ph.*, i.english_name, i.telugu_name, i.unit, i.category 
    FROM purchase_history ph
    JOIN items i ON ph.item_id = i.id
    WHERE strftime('%Y-%m', ph.purchase_date) = ?
    ORDER BY ph.purchase_date DESC
  `;
  const purchases = await db.all(query, [month]);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Purchases');

  worksheet.columns = [
    { header: 'Purchase Date', key: 'date', width: 15 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Item (English)', key: 'english_name', width: 20 },
    { header: 'Item (Telugu)', key: 'telugu_name', width: 20 },
    { header: 'Quantity', key: 'quantity', width: 12 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Price / Unit (₹)', key: 'price_per_unit', width: 15 },
    { header: 'Total Price (₹)', key: 'total_price', width: 15 }
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E3A8A' }
  };

  purchases.forEach((p) => {
    worksheet.addRow({
      date: p.purchase_date ? p.purchase_date.split('T')[0] : '',
      category: p.category,
      english_name: p.english_name,
      telugu_name: p.telugu_name || '',
      quantity: p.quantity,
      unit: p.unit,
      price_per_unit: p.price_per_unit,
      total_price: p.total_price
    });
  });

  const totalExpense = purchases.reduce((sum, p) => sum + p.total_price, 0);
  worksheet.addRow({});
  const totalRow = worksheet.addRow({
    english_name: 'Total Expenses',
    total_price: totalExpense
  });
  totalRow.getCell('english_name').font = { bold: true };
  totalRow.getCell('total_price').font = { bold: true, color: { argb: '16A34A' } };

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

// Generate Shopping List PDF with checkboxes and domain groupings
export async function generateShoppingListPDF() {
  const query = `
    SELECT sl.quantity as needed_quantity, i.english_name, i.telugu_name, i.unit, i.category, i.price
    FROM shopping_list sl
    JOIN items i ON sl.item_id = i.id
    WHERE sl.status = 'pending'
  `;
  const items = await db.all(query);

  const doc = new PDFDocument({ margin: 50 });

  return new Promise(async (resolve, reject) => {
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', reject);

    const hasTeluguFont = await setupPdfFont(doc);

    // Header / Branding
    if (hasTeluguFont) {
      doc.font('Helvetica-Bold').fontSize(22).fillColor('#0f172a').text('Shopping List / ', { align: 'center', continued: true })
         .font('TeluguFont').text('సరుకుల జాబితా');
    } else {
      doc.font('Helvetica-Bold').fontSize(22).fillColor('#0f172a').text('Shopping List', { align: 'center' });
    }
    doc.font('Helvetica').fontSize(10).fillColor('#64748b').text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, { align: 'center' });
    doc.moveDown(1.5);

    const isPachariItem = (item) => {
      const cat = (item.category || '').toLowerCase();
      const nameLower = (item.english_name || '').toLowerCase();
      const telName = item.telugu_name || '';
      const isNameMatch = nameLower.includes('garlic') || 
                          nameLower.includes('onion') || 
                          telName.includes('ఉల్లిపాయ') || 
                          telName.includes('తెల్లగడ్డ') || 
                          telName.includes('వెల్లుల్లి');
      if (isNameMatch) return true;
      return ['grains', 'oils', 'sweeteners', 'pulses', 'spices', 'groceries'].includes(cat);
    };

    const pachari = items.filter(item => isPachariItem(item));
    const fancy = items.filter(item => !isPachariItem(item));

    const renderTable = (sectionTitle, list, startY) => {
      const titleParts = sectionTitle.split(' / ');
      if (titleParts.length > 1 && hasTeluguFont) {
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#0b132b').text(titleParts[0] + ' / ', 50, startY, { continued: true })
           .font('TeluguFont').text(titleParts[1]);
      } else {
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#0b132b').text(sectionTitle, 50, startY);
      }
      doc.moveDown(0.5);

      const tableTop = doc.y;
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(9);
      doc.text('Status', 50, tableTop);
      if (hasTeluguFont) {
        doc.font('Helvetica-Bold').text('Item (English / ', 100, tableTop, { continued: true })
           .font('TeluguFont').text('సరుకు', { continued: true })
           .font('Helvetica-Bold').text(')');
      } else {
        doc.font('Helvetica-Bold').text('Item (English / Telugu)', 100, tableTop);
      }
      doc.font('Helvetica-Bold').text('Quantity', 330, tableTop, { width: 80, align: 'right' });
      doc.font('Helvetica-Bold').text('Est. Cost', 430, tableTop, { width: 100, align: 'right' });

      doc.moveTo(50, tableTop + 15).lineTo(530, tableTop + 15).strokeColor('#e2e8f0').stroke();

      let currentY = tableTop + 25;

      if (list.length === 0) {
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(10).text('No items to purchase in this section.', 70, currentY);
        currentY += 20;
      } else {
        list.forEach((item) => {
          // Draw checkbox
          doc.rect(50, currentY, 12, 12).strokeColor('#94a3b8').stroke();

          // Text details
          if (hasTeluguFont && item.telugu_name && item.telugu_name !== item.english_name) {
            doc.fillColor('#0f172a').font('Helvetica').fontSize(10).text(`${item.english_name} / `, 100, currentY, { continued: true })
               .font('TeluguFont').text(item.telugu_name);
          } else {
            doc.fillColor('#0f172a').font('Helvetica').fontSize(10).text(item.english_name, 100, currentY);
          }
          
          doc.fillColor('#0f172a').font('Helvetica').fontSize(10).text(`${item.needed_quantity} ${item.unit}`, 330, currentY, { width: 80, align: 'right' });
          
          const estCost = item.needed_quantity * (item.price || 0);
          doc.fillColor('#0f172a').font('Helvetica').fontSize(10).text(`Rs. ${estCost.toFixed(2)}`, 430, currentY, { width: 100, align: 'right' });

          currentY += 22;

          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }
        });
      }

      return currentY + 15;
    };

    let nextY = doc.y;
    nextY = renderTable('1. Pachari Provisions / పచారీ సరుకులు', pachari, nextY);
    
    if (nextY > 600) {
      doc.addPage();
      nextY = 50;
    }
    
    renderTable('2. General & Fancy / జనరల్ & ఫ్యాన్సీ', fancy, nextY);

    doc.end();
  });
}

