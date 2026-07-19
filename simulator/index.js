const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://localhost:1883");

const sensors = [1, 2, 3, 4, 5];

client.on("connect", () => {
  console.log("MQTT broker'a bağlanıldı");

  setInterval(() => {
    sensors.forEach((sensorId) => {
      const message = {
        sensorId,
        soilMoisture: +(20 + Math.random() * 50).toFixed(1),
        temperature: +(18 + Math.random() * 16).toFixed(1),
        airHumidity: +(35 + Math.random() * 40).toFixed(1),
        battery: +(80 + Math.random() * 20).toFixed(1),
        timestamp: new Date().toISOString(),
      };
      client.publish(`farm/sensors/${sensorId}`, JSON.stringify(message));
      console.log(`Gönderildi → farm/sensors/${sensorId}`, message.soilMoisture + "%");
    });
  }, 10000);
});

client.on("error", (err) => console.error("MQTT hatası:", err.message));