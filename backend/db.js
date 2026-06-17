import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : (process.env.RAILWAY_VOLUME_MOUNT_PATH
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'kitchen.db')
    : path.resolve(__dirname, 'kitchen.db'));

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

async function initDb() {
  db.serialize(async () => {
    // Users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL
      )
    `);

    // Items table
    await run(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        english_name TEXT NOT NULL,
        telugu_name TEXT,
        quantity REAL NOT NULL DEFAULT 0.0,
        unit TEXT NOT NULL,
        threshold REAL NOT NULL DEFAULT 0.0,
        category TEXT NOT NULL,
        price REAL NOT NULL DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Shopping List table
    await run(`
      CREATE TABLE IF NOT EXISTS shopping_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER UNIQUE NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        quantity REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Purchase History table
    await run(`
      CREATE TABLE IF NOT EXISTS purchase_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        quantity REAL NOT NULL,
        price_per_unit REAL NOT NULL,
        total_price REAL NOT NULL,
        purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed users
    const userCount = await get("SELECT COUNT(*) as count FROM users");
    if (userCount.count === 0) {
      await run("INSERT INTO users (name, email, role) VALUES (?, ?, ?)", ['Mother', 'mother@kitchen.com', 'Mother']);
      await run("INSERT INTO users (name, email, role) VALUES (?, ?, ?)", ['Father', 'father@kitchen.com', 'Father']);
      await run("INSERT INTO users (name, email, role) VALUES (?, ?, ?)", ['Admin', 'admin@kitchen.com', 'Admin']);
    }

    // Migration: Update Deeparadhana Oil to 1L Bottle unit
    await run("UPDATE items SET unit = '1L Bottle' WHERE english_name = 'Deeparadhana Oil'");

    // Seed items matching the user's uploaded handwritten notes
    const itemCount = await get("SELECT COUNT(*) as count FROM items");
    if (itemCount.count === 0) {
      const seedItems = [
        ['Rice', 'బియ్యం', 15.0, 'Kg', 5.0, 'Grains', 60.0],
        ['Sugar', 'చక్కెర', 1.2, 'Kg', 2.0, 'Sweeteners', 44.0],
        ['Sunflower Oil', 'సన్ ఫ్లవర్ నూనె', 2.0, 'Packets (1L)', 2.0, 'Oils', 150.0],
        ['Toor Dal', 'కందిపప్పు', 3.0, 'Kg', 1.0, 'Pulses', 170.0],
        ['Tamarind', 'చింతపండు', 0.5, 'Kg', 1.0, 'Groceries', 200.0],
        ['Turmeric', 'పసుపు', 0.2, 'Kg', 0.5, 'Spices', 300.0],
        ['Groundnuts', 'వేరుశనగపప్పులు', 3.0, 'Kg', 1.0, 'Grains', 130.0],
        ['Wheat Flour', 'గోధుమ పిండి', 2.0, 'Kg', 1.0, 'Grains', 63.0],
        ['Garlic', 'తెల్లగడ్డలు', 0.5, 'Kg', 0.5, 'Vegetables', 210.0],
        ['Onions', 'ఉల్లిపాయలు', 2.0, 'Kg', 2.0, 'Vegetables', 40.0],
        ['Deeparadhana Oil', 'దీపారాధన నూనె', 0.0, '1L Bottle', 2.0, 'Oils', 150.0],
        ['Camphor', 'కర్పూర బిళ్లలు', 0.0, 'Packets', 1.0, 'Groceries', 50.0],
        ['Exo Soap', 'ఎక్సో సబ్బు', 1.0, 'Pieces', 1.0, 'Groceries', 30.0],
        ['Milk', 'పాలు', 2.5, 'L', 1.0, 'Dairy', 60.0],
        ['Curd', 'పెరుగు', 0.0, 'Packets', 1.0, 'Dairy', 30.0],
        ['Butter', 'వెన్న', 0.0, 'Packets', 1.0, 'Dairy', 50.0],
        ['Ghee', 'నెయ్యి', 0.0, 'Packets', 1.0, 'Dairy', 350.0],
        ['Cheese', 'చీజ్', 0.0, 'Packets', 1.0, 'Dairy', 120.0],
        ['Maggi', 'మ్యాగీ', 6.0, 'Packets', 2.0, 'Snacks', 14.0],
        ['Horlicks', 'హార్లిక్స్', 2.0, 'Kg', 0.5, 'Snacks', 320.0],
        ['Colgate Paste', 'కోల్గేట్ పేస్ట్', 1.0, 'Pieces', 1.0, 'Personal Care', 90.0],
        ['Salt', 'ఉప్పు', 1.0, 'Kg', 0.5, 'Spices', 25.0]
      ];

      for (const item of seedItems) {
        await run(
          "INSERT INTO items (english_name, telugu_name, quantity, unit, threshold, category, price) VALUES (?, ?, ?, ?, ?, ?, ?)",
          item
        );
      }

      const lowStockItems = await all("SELECT id, (threshold - quantity) as needed FROM items WHERE quantity < threshold");
      for (const item of lowStockItems) {
        const neededQty = Math.max(item.needed, 1);
        await run(
          "INSERT OR IGNORE INTO shopping_list (item_id, quantity) VALUES (?, ?)",
          [item.id, neededQty]
        );
      }

      // Add actual cost structures matching the scanned bill totals
      const today = new Date();
      for (let i = 4; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 15).toISOString().split('T')[0];
        await run("INSERT INTO purchase_history (item_id, quantity, price_per_unit, total_price, purchase_date) VALUES (1, 20, 60, 1200, ?)", [date]);
        await run("INSERT INTO purchase_history (item_id, quantity, price_per_unit, total_price, purchase_date) VALUES (4, 3, 170, 510, ?)", [date]);
        await run("INSERT INTO purchase_history (item_id, quantity, price_per_unit, total_price, purchase_date) VALUES (3, 2, 150, 300, ?)", [date]);
      }
    }

    // Deduplicate existing duplicate items in the database
    const allItems = await all("SELECT * FROM items");
    const seen = new Map();
    for (const item of allItems) {
      const key = (item.english_name || '').toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, item);
      } else {
        const originalItem = seen.get(key);
        console.log(`[Database Migration] Found duplicate item: ${item.english_name} (ID: ${item.id}). Merging with original ID: ${originalItem.id}`);
        
        // Sum the quantities
        const newQty = originalItem.quantity + item.quantity;
        await run("UPDATE items SET quantity = ? WHERE id = ?", [newQty, originalItem.id]);
        originalItem.quantity = newQty;

        // Resolve shopping_list conflicts (item_id is UNIQUE)
        const originalList = await get("SELECT * FROM shopping_list WHERE item_id = ?", [originalItem.id]);
        const duplicateList = await get("SELECT * FROM shopping_list WHERE item_id = ?", [item.id]);
        if (originalList && duplicateList) {
          const newNeededQty = originalList.quantity + duplicateList.quantity;
          await run("UPDATE shopping_list SET quantity = ? WHERE id = ?", [newNeededQty, originalList.id]);
          await run("DELETE FROM shopping_list WHERE id = ?", [duplicateList.id]);
        } else if (duplicateList) {
          await run("UPDATE shopping_list SET item_id = ? WHERE id = ?", [originalItem.id, duplicateList.id]);
        }

        // Update purchase_history references
        await run("UPDATE purchase_history SET item_id = ? WHERE item_id = ?", [originalItem.id, item.id]);

        // Delete the duplicate item record
        await run("DELETE FROM items WHERE id = ?", [item.id]);
      }
    }

    // Ensure Onions is seeded (Self-healing check)
    const onionsItem = await get("SELECT * FROM items WHERE LOWER(english_name) = 'onions'");
    if (!onionsItem) {
      console.log("[Database Migration] Seeding missing Onions item");
      await run(
        "INSERT INTO items (english_name, telugu_name, quantity, unit, threshold, category, price) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ['Onions', 'ఉల్లిపాయలు', 2.0, 'Kg', 2.0, 'Vegetables', 40.0]
      );
    }

    // Ensure Garlic is seeded (Self-healing check)
    const garlicItem = await get("SELECT * FROM items WHERE LOWER(english_name) = 'garlic'");
    if (!garlicItem) {
      console.log("[Database Migration] Seeding missing Garlic item");
      await run(
        "INSERT INTO items (english_name, telugu_name, quantity, unit, threshold, category, price) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ['Garlic', 'తెల్లగడ్డలు', 0.5, 'Kg', 0.5, 'Vegetables', 210.0]
      );
    }

    // Category and translation correction self-healing updates
    console.log("[Database Migration] Running category and translation correction updates");
    await run("UPDATE items SET category = 'Groceries' WHERE LOWER(english_name) = 'exo soap'");
    await run("UPDATE items SET english_name = 'Curd', category = 'Dairy' WHERE (LOWER(english_name) = 'cheese' AND telugu_name = 'పెరుగు') OR LOWER(english_name) = 'curd'");
    await run("UPDATE items SET telugu_name = 'వెన్న', category = 'Dairy' WHERE LOWER(english_name) = 'butter'");
    await run("UPDATE items SET category = 'Dairy' WHERE LOWER(english_name) = 'milk'");

    // Ensure all standard dairy items are seeded (Self-healing checks)
    const dairyItemsList = [
      ['Milk', 'పాలు', 2.5, 'L', 1.0, 'Dairy', 60.0],
      ['Curd', 'పెరుగు', 0.0, 'Packets', 1.0, 'Dairy', 30.0],
      ['Butter', 'వెన్న', 0.0, 'Packets', 1.0, 'Dairy', 50.0],
      ['Ghee', 'నెయ్యి', 0.0, 'Packets', 1.0, 'Dairy', 350.0],
      ['Cheese', 'చీజ్', 0.0, 'Packets', 1.0, 'Dairy', 120.0]
    ];

    for (const item of dairyItemsList) {
      const dbItem = await get("SELECT * FROM items WHERE LOWER(english_name) = ?", [item[0].toLowerCase()]);
      if (!dbItem) {
        console.log(`[Database Migration] Seeding missing Dairy item: ${item[0]}`);
        await run(
          "INSERT INTO items (english_name, telugu_name, quantity, unit, threshold, category, price) VALUES (?, ?, ?, ?, ?, ?, ?)",
          item
        );
      }
    }

    // Ensure all standard General, Fancy, and Snack items are seeded (Self-healing checks)
    const additionalItemsList = [
      ['Maggi', 'మ్యాగీ', 6.0, 'Packets', 2.0, 'Snacks', 14.0],
      ['Horlicks', 'హార్లిక్స్', 2.0, 'Kg', 0.5, 'Snacks', 320.0],
      ['Colgate Paste', 'కోల్గేట్ పేస్ట్', 1.0, 'Pieces', 1.0, 'Personal Care', 90.0],
      ['Salt', 'ఉప్పు', 1.0, 'Kg', 0.5, 'Spices', 25.0]
    ];

    for (const item of additionalItemsList) {
      const dbItem = await get("SELECT * FROM items WHERE LOWER(english_name) = ?", [item[0].toLowerCase()]);
      if (!dbItem) {
        console.log(`[Database Migration] Seeding missing item: ${item[0]}`);
        await run(
          "INSERT INTO items (english_name, telugu_name, quantity, unit, threshold, category, price) VALUES (?, ?, ?, ?, ?, ?, ?)",
          item
        );
      }
    }
  });
}

initDb().catch(console.error);

export default {
  run,
  all,
  get,
  initDb
};
