import express from 'express';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const PIN = process.env.PIN || '';

const app = express();
const db = new Database(process.env.DB_PATH || join(__dirname, 'schowek.db'));

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS clips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    label TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

const stmts = {
  insert:  db.prepare('INSERT INTO clips (content, label) VALUES (?, ?)'),
  list:    db.prepare('SELECT id, label, substr(content,1,200) AS preview, length(content) AS size, created_at FROM clips ORDER BY created_at DESC'),
  get:     db.prepare('SELECT * FROM clips WHERE id = ?'),
  delete:  db.prepare('DELETE FROM clips WHERE id = ?'),
  latest:  db.prepare('SELECT * FROM clips ORDER BY created_at DESC LIMIT 1'),
  deleteAll: db.prepare('DELETE FROM clips'),
};

app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(__dirname, 'public')));

// Simple PIN middleware (optional)
function checkPin(req, res, next) {
  if (!PIN) return next();
  const token = req.headers['x-pin'] || req.query.pin;
  if (token !== PIN) return res.status(401).json({ error: 'Nieprawidłowy PIN' });
  next();
}

app.use('/api', checkPin);

// GET /api/clips – lista
app.get('/api/clips', (req, res) => {
  res.json(stmts.list.all());
});

// GET /api/clips/latest – ostatni wpis (pełna treść)
app.get('/api/clips/latest', (req, res) => {
  const row = stmts.latest.get();
  if (!row) return res.status(404).json({ error: 'Schowek pusty' });
  res.json(row);
});

// GET /api/clips/:id – pełna treść
app.get('/api/clips/:id', (req, res) => {
  const row = stmts.get.get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Nie znaleziono' });
  res.json(row);
});

// POST /api/clips – wrzuć
app.post('/api/clips', (req, res) => {
  const { content, label } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Brak treści' });
  }
  const result = stmts.insert.run(content.trim(), label?.trim() || null);
  const row = stmts.get.get(result.lastInsertRowid);
  res.status(201).json(row);
});

// DELETE /api/clips/all – wyczyść wszystko
app.delete('/api/clips/all', (req, res) => {
  stmts.deleteAll.run();
  res.json({ ok: true });
});

// DELETE /api/clips/:id – usuń jeden
app.delete('/api/clips/:id', (req, res) => {
  const info = stmts.delete.run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Nie znaleziono' });
  res.json({ ok: true });
});

// PIN status (nie zdradza wartości)
app.get('/api/pin-required', (_req, res) => {
  res.json({ required: !!PIN });
});

app.listen(PORT, () => {
  console.log(`Schowek działa na http://localhost:${PORT}${PIN ? ' (PIN wymagany)' : ''}`);
});
