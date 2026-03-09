/**
 * Diagnostyka połączenia z bazą MySQL.
 * Uruchom: node check-db.mjs
 */
import { createConnection } from 'mysql2/promise';

let cfg;
try {
  const { config } = await import('dotenv');
  config();
  cfg = {
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  };
} catch {
  cfg = {
    host:     process.env.DB_HOST || 'localhost',
    port:     3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  };
}

console.log('\n=== Konfiguracja ===');
console.log('DB_HOST:', cfg.host);
console.log('DB_PORT:', cfg.port);
console.log('DB_USER:', cfg.user  || '(BRAK — sprawdź .env)');
console.log('DB_PASS:', cfg.password ? '***' : '(BRAK — sprawdź .env)');
console.log('DB_NAME:', cfg.database || '(BRAK — sprawdź .env)');

if (!cfg.user || !cfg.password || !cfg.database) {
  console.error('\n[BŁĄD] Brakuje zmiennych DB w .env — uzupełnij i spróbuj ponownie.');
  process.exit(1);
}

console.log('\n=== Test połączenia ===');
let conn;
try {
  conn = await createConnection(cfg);
  console.log('Połączono z serwerem MySQL.');

  const [[v]] = await conn.execute('SELECT VERSION() AS v');
  console.log('Wersja MySQL:', v.v);

  const [[db]] = await conn.execute('SELECT DATABASE() AS d');
  console.log('Baza danych:', db.d);

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
    console.error('→ Zły użytkownik lub hasło.');
  } else if (err.code === 'ER_BAD_DB_ERROR') {
    console.error('→ Baza nie istnieje. Sprawdź DB_NAME i utwórz ją w cPanel.');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('→ Serwer MySQL nie odpowiada. Spróbuj DB_HOST=127.0.0.1');
  }
  process.exit(1);
} finally {
  if (conn) await conn.end();
}
