# Akıllı Sulama Sensör Telemetri Platformu

Tarladaki sensörlerden (toprak nemi, sıcaklık, hava nemi, pil seviyesi) gelen telemetri
verilerini MQTT üzerinden toplayan, PostgreSQL'de zaman serisi olarak saklayan, REST API
ile sunan ve web tabanlı bir gösterge paneliyle görselleştiren uçtan uca bir sistem.

Toprak nemi belirlenen eşiğin altına düştüğünde otomatik olarak **"sulama gerekli"**
uyarısı üretilir; yani sistem yalnızca veri toplamakla kalmaz, basit bir karar destek
mantığı da içerir.

Gerçek donanım yerine yazılımsal bir **sensör simülatörü** kullanılır — IoT projelerinde
prototip aşamasının standart yaklaşımı.

> Yonca Teknoloji (Suyabakan hattı) staj projesi — Temmuz 2026

---

## Mimari

```
┌──────────────────┐   MQTT (publish)   ┌──────────────────┐
│ Sensör Simülatörü│ ─────────────────▶ │ Mosquitto Broker │
│ (5 sanal sensör) │  farm/sensors/{id} └────────┬─────────┘
└──────────────────┘                            │ subscribe
                                                ▼
┌──────────────────┐    SQL (insert)   ┌──────────────────┐
│    PostgreSQL    │ ◀──────────────── │  Backend (Node)  │
│ sensors/readings │                   │ MQTT sub + REST  │
│      alerts      │ ──────────────▶   │                  │
└──────────────────┘    SQL (select)   └────────┬─────────┘
                                                │ REST API (JWT)
                                                ▼
                                       ┌──────────────────┐
                                       │ React Dashboard  │
                                       │ kartlar + grafik │
                                       └──────────────────┘
```

**Veri akışı**

1. Simülatör her 10 saniyede bir, her sensör için JSON telemetri mesajı üretip
   `farm/sensors/{id}` topic'ine yayınlar.
2. Backend broker'a abone olur; gelen mesajı doğrular (şema + değer aralığı) ve
   `readings` tablosuna yazar.
3. Her kayıtta eşik kontrolü yapılır; toprak nemi %25'in altındaysa `alerts` tablosuna
   uyarı düşülür (aynı sensör için açık uyarı varsa tekrarlanmaz).
4. Dashboard REST API üzerinden anlık değerleri ve son 24 saatlik grafiği çeker,
   15 saniyede bir yeniler.

## Teknoloji yığını

| Katman | Teknoloji |
| --- | --- |
| Backend / API | Node.js + Express |
| Veritabanı | PostgreSQL 16 |
| Mesajlaşma | MQTT — Eclipse Mosquitto 2 |
| Sensör simülatörü | Node.js |
| Frontend | React + Vite + Recharts |
| Kimlik doğrulama | JWT |
| Ortam | Docker Compose |
| Test / doküman | Postman (newman) + README |

---

## Kurulum

Gereksinim: Docker Desktop ve Node.js 20+.

```bash
git clone <repo-url> && cd sulama-telemetri
docker compose up -d
```

Ardından backend ve simülatörü çalıştırın:

```bash
cd backend && npm install && cp .env.example .env && npm start
```

```bash
cd simulator && npm install && npm start
```

Servisler:

| Servis | Adres |
| --- | --- |
| PostgreSQL | `localhost:5432` (kullanıcı `sulama` / parola `sulama123` / db `telemetri`) |
| Mosquitto | `localhost:1883` |
| Backend API | `http://localhost:4000` |

MQTT trafiğini dışarıdan izlemek için:

```bash
docker exec sulama-telemetri-mosquitto-1 mosquitto_sub -t "farm/sensors/#" -v
```

### Ortam değişkenleri (`backend/.env`)

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `PORT` | `4000` | API portu |
| `PGHOST` / `PGPORT` | `localhost` / `5432` | PostgreSQL adresi |
| `PGUSER` / `PGPASSWORD` / `PGDATABASE` | `sulama` / `sulama123` / `telemetri` | DB kimlik bilgileri |
| `MQTT_URL` | `mqtt://localhost:1883` | Broker adresi |
| `MQTT_TOPIC` | `farm/sensors/+` | Abone olunan topic |
| `MOISTURE_THRESHOLD` | `25` | Uyarı eşiği (%) |
| `JWT_SECRET` | — | Token imzalama anahtarı |
| `ADMIN_USER` / `ADMIN_PASSWORD` | `admin` / `sulama123` | Giriş bilgileri |

Simülatör `MQTT_URL` ve `SIM_PERIOD_MS` (varsayılan `10000`) değişkenlerini kullanır.

---

## Veritabanı şeması

`db/init.sql` konteyner ilk kez ayağa kalkarken otomatik çalışır ve 5 sanal sensörü ekler.

- **sensors** — sensör tanımları (`name`, `location`, `type`)
- **readings** — telemetri kayıtları (`soil_moisture`, `temperature`, `air_humidity`,
  `battery`, `recorded_at`)
- **alerts** — sulama uyarıları (`alert_type`, `message`, `value`, `resolved`)

Zaman aralıklı sorgular (son 24 saat, ortalama vb.) `idx_readings_sensor_time
(sensor_id, recorded_at DESC)` indeksini kullanır; bu indeks olmadan her sorgu tüm
tabloyu taramak zorunda kalır.

---

## Sensör simülatörü

Rastgele sayı üretmek yerine gerçekçi bir fiziksel davranış taklit edilir:

- **Kuruma eğrisi** — toprak nemi her okumada %0,1–0,3 arası düşer (buharlaşma).
- **Sulama olayı** — nem %22'nin altına inince %55–65 aralığına sıçrar; grafikte
  gerçekçi **testere dişi** deseni oluşur.
- **Sıcaklık** — günün saatine bağlı sinüs eğrisi (gece ~18 °C, öğleden sonra ~34 °C)
  artı küçük rastgele gürültü.
- **Hava nemi** — sıcaklıkla ters orantılı hareket eder.
- **Pil** — günde ~%1 düşer.
- **Sensör çeşitliliği** — 5 sensörün başlangıç nemi ve kuruma hızı farklıdır; hepsi
  aynı anda uyarı üretmez.

Örnek MQTT mesajı (topic: `farm/sensors/3`):

```json
{
  "sensorId": 3,
  "soilMoisture": 31.4,
  "temperature": 27.8,
  "airHumidity": 48.2,
  "battery": 87.5,
  "timestamp": "2026-07-20T09:41:10Z"
}
```

Broker'a herkes yayın yapabildiği için backend, veritabanına yazmadan önce mesajı
doğrular: zorunlu alanlar, tipler, değer aralıkları ve topic'teki sensör id'sinin
gövdedekiyle tutarlılığı. Doğrulamayı geçemeyen mesaj loglanır ve yok sayılır.

---

## REST API

Taban adres: `http://localhost:4000`

`/api/health` ve `/api/auth/login` dışındaki tüm uçlar
`Authorization: Bearer <token>` başlığı ister.

| Metot | Endpoint | Açıklama |
| --- | --- | --- |
| `POST` | `/api/auth/login` | JWT token üretir |
| `GET` | `/api/sensors` | Sensör listesi + her birinin son okuması |
| `GET` | `/api/sensors/:id/readings?range=24h` | Zaman aralıklı ham veri (`1h` / `24h` / `7d`) |
| `GET` | `/api/sensors/:id/stats?range=24h` | min / max / ortalama değerler |
| `GET` | `/api/alerts?resolved=false` | Aktif (çözülmemiş) uyarılar |
| `PATCH` | `/api/alerts/:id/resolve` | Uyarıyı 'sulama yapıldı' olarak kapat |
| `GET` | `/api/health` | Servis + DB + MQTT bağlantı durumu |

### Örnek istekler

**Giriş**

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"sulama123"}'
```

```json
{ "token": "eyJhbGciOiJIUzI1NiIs...", "tokenType": "Bearer", "expiresIn": "8h" }
```

**Sensör listesi**

```bash
curl http://localhost:4000/api/sensors -H "Authorization: Bearer $TOKEN"
```

```json
[
  {
    "id": 1,
    "name": "Sera-1 Kuzey",
    "location": "Parsel A / 38.42N 27.14E",
    "type": "soil",
    "lastReading": {
      "soilMoisture": 56.2,
      "temperature": 32.5,
      "airHumidity": 43.9,
      "battery": 97,
      "recordedAt": "2026-07-25T11:28:32.118Z"
    }
  }
]
```

**İstatistik**

```bash
curl "http://localhost:4000/api/sensors/1/stats?range=24h" -H "Authorization: Bearer $TOKEN"
```

```json
{
  "sensor": { "id": 1, "name": "Sera-1 Kuzey" },
  "range": "24h",
  "stats": {
    "count": 15,
    "soilMoisture": { "min": 56.2, "max": 57.9, "avg": 57.03 },
    "temperature": { "min": 32.1, "max": 32.8, "avg": 32.37 }
  }
}
```

**Uyarıyı kapatma**

```bash
curl -X PATCH http://localhost:4000/api/alerts/1/resolve -H "Authorization: Bearer $TOKEN"
```

### Hata yanıtları

| Kod | Durum |
| --- | --- |
| `400` | Geçersiz `range`, geçersiz id veya eksik gövde alanı |
| `401` | Token yok, geçersiz ya da süresi dolmuş; hatalı kullanıcı/parola |
| `404` | Sensör veya uyarı bulunamadı |
| `409` | Uyarı zaten çözülmüş |
| `503` | `/api/health` — DB veya MQTT bağlantısı kopuk |

---

## API testleri

Postman koleksiyonu: `docs/postman/Sulama-Telemetri.postman_collection.json`

Postman'de içe aktarıp önce **Auth / Login** isteğini çalıştırın; dönen token otomatik
olarak `{{token}}` değişkenine yazılır. Komut satırından tüm koleksiyonu çalıştırmak için:

```bash
npx newman run docs/postman/Sulama-Telemetri.postman_collection.json
```

Koleksiyon başarılı senaryoların yanı sıra hata durumlarını da (401, 400, 404) test eder.

---

## Proje yapısı

```
sulama-telemetri/
├── backend/            Express API + MQTT abonesi
│   └── src/
│       ├── routes/       auth, sensors, alerts, health
│       ├── services/     veritabanı sorguları
│       ├── middleware/   auth, hata yakalama
│       ├── mqtt/         abonelik ve mesaj işleme
│       └── validation.js mesaj doğrulama kuralları
├── simulator/          5 sanal sensör, MQTT publisher
├── frontend/           React dashboard
├── db/init.sql         şema + seed veri
├── mosquitto/          broker yapılandırması
└── docker-compose.yml
```
