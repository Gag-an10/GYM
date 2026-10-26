const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'data', 'ironbase.db');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function initDatabase() {
  const fs = require('fs');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        blurb TEXT,
        tags TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(id)
      )
    `);

    const seedProducts = [
      { id: 'db', name: 'Adjustable Dumbbells', category: 'equipment', price: 249, blurb: '5–52.5 lb pair for progressive home lifting.', tags: 'home, dumbbell, strength' },
      { id: 'kb', name: 'Competition Kettlebell', category: 'equipment', price: 89, blurb: '24 kg cast bell with a smooth steel handle.', tags: 'kettlebell, cardio, strength' },
      { id: 'bench', name: 'Flat Utility Bench', category: 'equipment', price: 179, blurb: '11-gauge frame, rated for heavy pressing.', tags: 'bench, press, home gym' },
      { id: 'bands', name: 'Resistance Band Set', category: 'equipment', price: 36, blurb: 'Five latex bands from warm-up to assisted pull-ups.', tags: 'bands, mobility, warmup' },
      { id: 'whey', name: 'Whey Isolate', category: 'supplements', price: 54, blurb: '25 g protein, low lactose, unflavored or cocoa.', tags: 'protein, powder, recovery' },
      { id: 'creatine', name: 'Creatine Monohydrate', category: 'supplements', price: 28, blurb: '5 g daily. Micronized, unflavored, 90 servings.', tags: 'creatine, energy, strength' },
      { id: 'pre', name: 'Daily Pre-Workout', category: 'supplements', price: 39, blurb: 'Caffeine, beta-alanine, and citrulline. No proprietary blend.', tags: 'pre-workout, focus, endurance' },
      { id: 'bars', name: 'Protein Bars — 12 pack', category: 'supplements', price: 32, blurb: '20 g protein, pocket-size, chocolate peanut.', tags: 'snack, protein, convenience' },
      { id: 'belt', name: '4" Lifting Belt', category: 'essentials', price: 68, blurb: 'Single-prong leather belt for squats and deads.', tags: 'belt, support, lifting' },
      { id: 'straps', name: 'Lifting Straps', category: 'essentials', price: 18, blurb: 'Cotton straps with neoprene padding.', tags: 'straps, grip, accessory' },
      { id: 'shaker', name: 'Leakproof Shaker', category: 'essentials', price: 14, blurb: '24 oz bottle with mixer grid and carry loop.', tags: 'shaker, bottle, gym bag' },
      { id: 'bag', name: 'Gym Duffle', category: 'essentials', price: 58, blurb: 'Shoe pocket, wet compartment, and strap loops.', tags: 'bag, travel, gear' }
    ];

    db.run('DELETE FROM products');
    const insert = db.prepare('INSERT OR REPLACE INTO products (id, name, category, price, blurb, tags) VALUES (?, ?, ?, ?, ?, ?)');
    seedProducts.forEach((product) => insert.run(product.id, product.name, product.category, product.price, product.blurb, product.tags));
    insert.finalize();
  });

  return db;
}

const db = initDatabase();

function getProductRows(query, category) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT id, name, category, price, blurb, tags FROM products WHERE 1 = 1`;
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (query) {
      sql += ' AND (LOWER(name) LIKE ? OR LOWER(blurb) LIKE ? OR LOWER(tags) LIKE ?)';
      const term = `%${query.toLowerCase()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY name ASC';

    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map((row) => ({ ...row, category: row.category })));
    });
  });
}

app.get('/api/products', async (req, res) => {
  const { search = '', category = 'all' } = req.query;

  try {
    const products = await getProductRows(search, category);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load products' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'ironbase-api' });
});

app.get('/api/cart', (req, res) => {
  db.all('SELECT p.id, p.name, p.category, p.price, ci.quantity FROM cart_items ci JOIN products p ON p.id = ci.product_id ORDER BY ci.created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Unable to load cart' });
    res.json(rows);
  });
});

app.post('/api/cart', (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId is required' });

  db.get('SELECT id FROM products WHERE id = ?', [productId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Invalid product lookup' });
    if (!row) return res.status(404).json({ error: 'Product not found' });

    db.get('SELECT * FROM cart_items WHERE product_id = ?', [productId], (choiceErr, cartRow) => {
      if (choiceErr) return res.status(500).json({ error: 'Unable to update cart' });

      if (cartRow) {
        db.run('UPDATE cart_items SET quantity = quantity + 1 WHERE product_id = ?', [productId], (updateErr) => {
          if (updateErr) return res.status(500).json({ error: 'Unable to add to cart' });
          res.json({ ok: true, productId, quantity: cartRow.quantity + 1 });
        });
      } else {
        db.run('INSERT INTO cart_items (product_id, quantity) VALUES (?, 1)', [productId], (insertErr) => {
          if (insertErr) return res.status(500).json({ error: 'Unable to add to cart' });
          res.status(201).json({ ok: true, productId, quantity: 1 });
        });
      }
    });
  });
});

app.delete('/api/cart/:productId', (req, res) => {
  const { productId } = req.params;
  db.run('DELETE FROM cart_items WHERE product_id = ?', [productId], (err) => {
    if (err) return res.status(500).json({ error: 'Unable to remove item' });
    res.json({ ok: true, productId });
  });
});

app.delete('/api/cart', (req, res) => {
  db.run('DELETE FROM cart_items', (err) => {
    if (err) return res.status(500).json({ error: 'Unable to clear cart' });
    res.json({ ok: true });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Ironbase API running at http://localhost:${port}`);
});

module.exports = app;
