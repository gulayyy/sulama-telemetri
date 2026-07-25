const config = require("./config");
const { waitForDatabase, pool } = require("./db");
const { startSubscriber } = require("./mqtt/subscriber");
const { createApp } = require("./app");

async function main() {
  await waitForDatabase();

  const mqttClient = startSubscriber();

  const server = createApp().listen(config.port, () => {
    console.log(`[api] http://localhost:${config.port} adresinde dinleniyor`);
  });

  const shutdown = async () => {
    console.log("\nServis kapatılıyor...");
    server.close();
    mqttClient.end(true);
    await pool.end();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Servis başlatılamadı:", err.message);
  process.exit(1);
});
