# Postman Koleksiyonu — Sulama Telemetri API

Bu klasör, sulama telemetri sisteminin HTTP katmanını test eden Postman koleksiyonunu içerir.

| Dosya | Açıklama |
|---|---|
| `sulama-telemetri.postman_collection.json` | 21 istek, 7 klasör, 163 test assertion'ı (79 isteğe özel + 4 ortak × 21) |
| `sulama-telemetri.postman_environment.json` | Local ortam değişkenleri |

> **Not:** REST API katmanı henüz yazılmadı. Bu koleksiyon şu an aynı zamanda **API kontratı** görevi görüyor — endpoint yolları, istek/yanıt gövdeleri ve durum kodları burada tanımlı. API yazıldıkça koleksiyon doğrulama aracına dönüşür.

## Kurulum

```bash
docker compose up -d          # Postgres + Mosquitto
node simulator/index.js       # sahte sensör verisi üretir
# API servisi (henüz yok) :3000 portunda ayağa kalkmalı
```

## Postman ile çalıştırma

1. Postman → **Import** → her iki JSON dosyasını seç
2. Sağ üstten **Sulama Telemetri - Local** ortamını seç
3. Koleksiyona sağ tıkla → **Run collection**

Klasörleri **sırayla** çalıştır: `Sensors` klasörü `sensorId` değişkenini, `Senaryo` klasörü `alertId` değişkenini sonraki isteklere devrediyor.

## Newman (CI / komut satırı)

```bash
npm install -g newman
newman run postman/sulama-telemetri.postman_collection.json \
  -e postman/sulama-telemetri.postman_environment.json \
  --reporters cli,json
```

## Değişkenler

| Değişken | Varsayılan | Ne işe yarıyor |
|---|---|---|
| `baseUrl` | `http://localhost:3000` | API kök adresi |
| `sensorId` | `1` | Testlerde kullanılan sensör; liste isteği bunu otomatik günceller |
| `readingId` | *(boş)* | POST sonrası script tarafından doldurulur |
| `alertId` | *(boş)* | Alarm listesi / senaryo tarafından doldurulur |
| `moistureThreshold` | `30` | Sulama alarmının tetiklendiği toprak nemi eşiği |

## Endpoint listesi

| # | Metot | Yol | Ne yapar |
|---|---|---|---|
| 1 | `GET` | `/health` | Servis + Postgres + MQTT sağlık kontrolü |
| 2 | `GET` | `/api/sensors` | Tüm sensörler |
| 3 | `GET` | `/api/sensors/:id` | Tek sensör detayı |
| 4 | `GET` | `/api/sensors/:id/latest` | Sensörün son ölçümü |
| 5 | `GET` | `/api/sensors/:id/readings` | Ölçüm geçmişi (`limit`, `from`, `to`) |
| 6 | `POST` | `/api/readings` | Manuel ölçüm girişi |
| 7 | `GET` | `/api/readings/:id` | Tek ölçüm |
| 8 | `GET` | `/api/alerts` | Alarmlar (`resolved`, `sensorId`) |
| 9 | `PATCH` | `/api/alerts/:id/resolve` | Alarmı kapat |
| 10 | `GET` | `/api/stats` | Özet istatistikler (`sensorId` opsiyonel) |

## Koleksiyon yapısı

**1. Health** — servisin ve bağımlılıklarının ayakta olduğunu doğrular.

**2. Sensors** — sensör kataloğu, tek sensör, son ölçüm, ölçüm geçmişi. Geçmiş isteğinde kayıtların `recorded_at` alanına göre **azalan** sırada geldiği kontrol edilir — bu `idx_readings_sensor_time (sensor_id, recorded_at DESC)` indeksinin sorguya doğru uygulandığının kanıtıdır.

**3. Readings** — POST ile ölçüm yazar, dönen `id` ile kaydın kalıcı olduğunu GET ederek doğrular. Pre-request script her çalıştırmada eşik üstü rastgele değerler üretir, böylece koleksiyon tekrar tekrar çalıştırılabilir.

**4. Alerts** — açık ve tüm alarm listeleri; `resolved` filtresinin gerçekten çalıştığı ve `alert_type` değerlerinin bilinen kümede olduğu kontrol edilir.

**5. Stats** — sayaçların negatif olmayan tamsayı, ortalamaların geçerli aralıkta ve `min <= avg <= max` tutarlılığında olduğu doğrulanır.

**6. Senaryo: Sulama Alarmı** — uçtan uca zincirli akış, koleksiyonun en değerli kısmı:

```
Eşik altı ölçüm gönder  →  IRRIGATION_NEEDED alarmı üretildi mi?
        ↓
Alarmı çöz (PATCH)      →  Açık listesinden düştü mü?
```

Alarmın `value` alanının gönderilen ölçümle birebir eşleştiği ve son 60 saniye içinde oluşturulduğu da kontrol edilir — yani eski bir alarm yanlışlıkla testi geçiremez.

**7. Hata Senaryoları** — 400/404 doğrulamaları. Öne çıkanlar:

- Aralık dışı nem (`150`) reddedilmeli — `NUMERIC(5,2)` en fazla `999.99` tutar
- Olmayan `sensorId` ile POST → ham Postgres FK hatası (`violates foreign key`) kullanıcıya **sızmamalı**
- `limit=abc` → doğrulanmadan SQL'e geçerse sorgu patlar

## Ortak testler

Koleksiyon seviyesinde tanımlı, **her istekten sonra** otomatik çalışan kontroller:

- Yanıt süresi < 1000 ms
- Durum kodu 5xx değil
- `Content-Type: application/json`
- Gövde geçerli JSON

Bu sayede her isteğe ayrı ayrı yazmaya gerek kalmıyor.

## Yanıt şeması varsayımları

- Liste dönen uçlar **düz JSON dizisi** döndürür, zarf (`{ "data": [...] }`) kullanılmaz
- Zaman alanları ISO-8601 / UTC (`TIMESTAMPTZ` karşılığı)
- `NUMERIC` sütunlar JSON'da **number** olarak döner, string değil — `node-postgres` varsayılan olarak `NUMERIC` tipini string'e çevirir, API tarafında `pg.types.setTypeParser` ile dönüştürme gerekir
- İstek gövdeleri **camelCase** (`soilMoisture`), yanıtlar **snake_case** (`soil_moisture`) — simülatörün MQTT payload'ı ile veritabanı sütun adları arasındaki mevcut farkı korur
- Hata gövdesi: `{ "error": "açıklayıcı mesaj" }`
