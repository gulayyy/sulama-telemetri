const { waitForDatabase, pool } = require("./db");
const { startSubscriber } = require("./mqtt/subscriber");

async function main() {
  await waitForDatabase();
  const mqttClient = startSubscriber();

  const shutdown = async () => {
    console.log("\nServis kapatılıyor...");
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
