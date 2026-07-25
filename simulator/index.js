const mqtt = require("mqtt");

const BROKER_URL = process.env.MQTT_URL || "mqtt://localhost:1883";
const PERIOD_MS = Number(process.env.SIM_PERIOD_MS || 10000);

// --- Gerçekçilik parametreleri -------------------------------------------
const IRRIGATION_TRIGGER = 22; // bu nem değerinin altına inince sulama yapılır
const WET_MIN = 55; // sulama sonrası ulaşılan en düşük nem
const WET_MAX = 65; // sulama sonrası ulaşılan en yüksek nem

const TEMP_MEAN = 26; // sinüs eğrisinin ortalaması → gece 18°C, gündüz 34°C
const TEMP_AMPLITUDE = 8;
const TEMP_PEAK_HOUR = 14; // sıcaklığın tepe yaptığı saat

// Pil günde ~%1 düşer; okuma başına düşüş periyoda göre hesaplanır.
const READINGS_PER_DAY = (24 * 60 * 60 * 1000) / PERIOD_MS;
const BATTERY_DROP_PER_READING = 1 / READINGS_PER_DAY;

// 5 sensörün başlangıç nemi ve kuruma hızı kasıtlı olarak farklı;
// böylece hepsi aynı anda eşiğin altına inip toplu uyarı üretmez.
const sensors = [
  { id: 1, name: "Sera-1 Kuzey", moisture: 58.0, dryRate: 0.12, battery: 97.0, tempOffset: -1.5 },
  { id: 2, name: "Sera-1 Güney", moisture: 44.0, dryRate: 0.18, battery: 91.0, tempOffset: -1.0 },
  { id: 3, name: "Açık Tarla-1", moisture: 36.0, dryRate: 0.25, battery: 84.0, tempOffset: 1.5 },
  { id: 4, name: "Açık Tarla-2", moisture: 62.0, dryRate: 0.3, battery: 78.0, tempOffset: 2.0 },
  { id: 5, name: "Fide Alanı", moisture: 50.0, dryRate: 0.15, battery: 65.0, tempOffset: 0.0 },
];

const round1 = (n) => +n.toFixed(1);
const between = (min, max) => min + Math.random() * (max - min);
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// Günün saatine bağlı sıcaklık: TEMP_PEAK_HOUR'da tepe, 12 saat sonra dip.
function baseTemperature(now) {
  const hour = now.getHours() + now.getMinutes() / 60;
  const phase = (2 * Math.PI * (hour - TEMP_PEAK_HOUR)) / 24;
  return TEMP_MEAN + TEMP_AMPLITUDE * Math.cos(phase);
}

// Hava nemi sıcaklıkla ters orantılı hareket eder (sıcak saatlerde düşer).
function airHumidityFor(temperature) {
  return clamp(95 - 1.6 * temperature + between(-3, 3), 30, 85);
}

function nextReading(sensor, now) {
  // 1) Kuruma eğrisi: buharlaşma nedeniyle nem her okumada yavaşça düşer.
  sensor.moisture -= sensor.dryRate * between(0.8, 1.2);

  // 2) Sulama olayı: eşiğin altına inince nem bir anda yükselir (testere dişi).
  let irrigated = false;
  if (sensor.moisture < IRRIGATION_TRIGGER) {
    sensor.moisture = between(WET_MIN, WET_MAX);
    irrigated = true;
  }
  sensor.moisture = clamp(sensor.moisture, 0, 100);

  // 3) Sıcaklık: sinüs eğrisi + sensöre özel sapma + küçük gürültü.
  const temperature = clamp(
    baseTemperature(now) + sensor.tempOffset + between(-0.4, 0.4),
    -10,
    60
  );

  // 4) Pil: sürekli ve yavaş düşüş.
  sensor.battery = clamp(sensor.battery - BATTERY_DROP_PER_READING, 0, 100);

  return {
    payload: {
      sensorId: sensor.id,
      soilMoisture: round1(sensor.moisture),
      temperature: round1(temperature),
      airHumidity: round1(airHumidityFor(temperature)),
      battery: +sensor.battery.toFixed(2),
      timestamp: now.toISOString(),
    },
    irrigated,
  };
}

const client = mqtt.connect(BROKER_URL);
let timer = null;

client.on("connect", () => {
  console.log(`MQTT broker'a bağlanıldı: ${BROKER_URL}`);
  console.log(`${sensors.length} sensör, ${PERIOD_MS / 1000} sn periyot ile yayına başlıyor.`);

  if (timer) return; // yeniden bağlanmada ikinci döngü kurulmasın
  timer = setInterval(() => {
    const now = new Date();
    for (const sensor of sensors) {
      const { payload, irrigated } = nextReading(sensor, now);
      client.publish(`farm/sensors/${sensor.id}`, JSON.stringify(payload), { qos: 1 });

      const suffix = irrigated ? "  ← SULAMA YAPILDI" : "";
      console.log(
        `farm/sensors/${sensor.id} | ${sensor.name.padEnd(13)} | ` +
          `nem %${payload.soilMoisture} | ${payload.temperature}°C | ` +
          `pil %${payload.battery.toFixed(1)}${suffix}`
      );
    }
  }, PERIOD_MS);
});

client.on("error", (err) => console.error("MQTT hatası:", err.message));
client.on("reconnect", () => console.log("MQTT yeniden bağlanılıyor..."));

process.on("SIGINT", () => {
  console.log("\nSimülatör durduruluyor.");
  clearInterval(timer);
  client.end(true, () => process.exit(0));
});
