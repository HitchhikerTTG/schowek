/**
 * Diagnostyka połączenia z bazą MySQL.
 * Uruchom: node check-db.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const cfg = {
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

console.log('\n=== Konfiguracja ===');
console.log('DB_HOST:', cfg.host);
console.log('DB_PORT:', cfg.port);
console.log('DB_USER:', cfg.user     || '(BRAK — sprawdź .env)');
console.log('DB_PASS:', cfg.password ? '***' : '(BRAK — sprawdź .env)');
console.log('DB_NAME:', cfg.database || '(BRAK — sprawdź .env)');

if (!cfg.user || !cfg.password || !cfg.database) {
  console.error('\n[BŁĄD] Brakuje zmiennych DB w .env');
  process.exit(1);
}

(async () => {
  let conn;
  try {
    console.log('\n=== Test połączenia ===');
    conn = await mysql.createConnection(cfg);
    console.log('Połączono z serwerem MySQL.');

    const [[v]] = await conn.execute('SELECT VERSION() AS v');
    console.log('Wersja MySQL:', v.v);

    const [tables] = await conn.execute("SHOW TABLES LIKE 'clips'");
    if (tables.length) {
      const [[cnt]] = await conn.execute('SELECT COUNT(*) AS n FROM clips');
      console.log('Tabela clips: istnieje,', cnt.n, 'wpisów');
    } else {
      console.log('Tabela clips: nie istnieje (zostanie stworzona przy starcie serwera)');
    }

    console.log('\n[OK] Baza danych działa poprawnie.');
  } catch (err) {
    console.error('\n[BŁĄD]', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('→ Zły użytkownik lub hasło. Sprawdź prefix w cPanel → MySQL Databases.');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('→ Baza nie istnieje. Sprawdź DB_NAME (zwykle z prefixem: login_nazwa).');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('→ Serwer MySQL nie odpowiada. Spróbuj DB_HOST=127.0.0.1');
    }
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
})();
