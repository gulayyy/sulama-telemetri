const { Pool, types } = require("pg");
const config = require("./config");

// pg, NUMERIC ve BIGINT değerlerini varsayılan olarak string döndürür.
// JSON yanıtlarında sayı görmek için tip çeviricilerini elle ayarlıyoruz.
types.setTypeParser(1700, (value) => (value === null ? null : parseFloat(value))); // numeric
types.setTypeParser(20, (value) => (value === null ? null : parseInt(value, 10))); // int8

// Bağlantı havuzu: her sorgu için yeni bağlantı açmak yerine hazır
// bağlantılar yeniden kullanılır (10 sn'de bir gelen insert'ler için önemli).
const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("[db] beklenmeyen havuz hatası:", err.message);
});

// Konteynerler aynı anda ayağa kalktığı için PostgreSQL hazır olana kadar bekle.
async function waitForDatabase(retries = 20, delayMs = 1500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query("SELECT 1");
      console.log(`[db] bağlandı: ${config.db.host}:${config.db.port}/${config.db.database}`);
      return;
    } catch (err) {
      console.log(`[db] hazır değil (${attempt}/${retries}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("PostgreSQL'e bağlanılamadı");
}

module.exports = { pool, query: (text, params) => pool.query(text, params), waitForDatabase };
