import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const PIN  = process.env.PIN  || '';

// ── Baza danych ────────────────────────────────────────────────────────────────

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT      || '3306'),
  user:               process.env.DB_USER,
  password:           process.env.DB_PASS,
  database:           process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    5,
  timezone:           '+00:00',
});

async function initDb() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS clips (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      content    MEDIUMTEXT NOT NULL,
      label      VARCHAR(60) DEFAULT NULL,
      created_at INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP())
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

// ── App ────────────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(__dirname, 'public')));

function checkPin(req, res, next) {
  if (!PIN) return next();
  const token = req.headers['x-pin'] || req.query.pin;
  if (token !== PIN) return res.status(401).json({ error: 'Nieprawidłowy PIN' });
  next();
}
app.use('/api', checkPin);

// GET /api/clips
app.get('/api/clips', async (_req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, label, SUBSTRING(content,1,200) AS preview, CHAR_LENGTH(content) AS size, created_at FROM clips ORDER BY created_at DESC'
  );
  res.json(rows);
});

// GET /api/clips/latest
app.get('/api/clips/latest', async (_req, res) => {
  const [rows] = await pool.execute('SELECT * FROM clips ORDER BY created_at DESC LIMIT 1');
  if (!rows.length) return res.status(404).json({ error: 'Schowek pusty' });
  res.json(rows[0]);
});

// GET /api/clips/:id
app.get('/api/clips/:id', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM clips WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Nie znaleziono' });
  res.json(rows[0]);
});

// POST /api/clips
app.post('/api/clips', async (req, res) => {
  const { content, label } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Brak treści' });
  }
  const [result] = await pool.execute(
    'INSERT INTO clips (content, label) VALUES (?, ?)',
    [content.trim(), label?.trim() || null]
  );
  const [rows] = await pool.execute('SELECT * FROM clips WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

// DELETE /api/clips/all
app.delete('/api/clips/all', async (_req, res) => {
  await pool.execute('DELETE FROM clips');
  res.json({ ok: true });
});

// DELETE /api/clips/:id
app.delete('/api/clips/:id', async (req, res) => {
  const [result] = await pool.execute('DELETE FROM clips WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Nie znaleziono' });
  res.json({ ok: true });
});

// PIN status
app.get('/api/pin-required', (_req, res) => {
  res.json({ required: !!PIN });
});

// Globalny handler błędów
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Błąd serwera' });
});

// ── Start ──────────────────────────────────────────────────────────────────────

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Schowek działa na http://localhost:${PORT}${PIN ? ' (PIN wymagany)' : ''}`);
    });
  })
  .catch(err => {
    console.error('Błąd połączenia z bazą danych:', err.message);
    console.error('Sprawdź zmienne DB_HOST, DB_USER, DB_PASS, DB_NAME w pliku .env');
    process.exit(1);
  });
