# Staj Defteri Notları

Bu dosya, defteri doldururken kullanılacak ham notlardır. Her gün için anlatım
**yapılan iş → kullanılan teknoloji → öğrenilen şey** üçlüsüyle kurulmuştur.
Teknik terimler Türkçe karşılıklarıyla birlikte verilmiştir.

> Projeyi her hafta başında şu cümleyle konumlandır: *"Şirketin Suyabakan ürün
> ailesine yönelik bir telemetri prototip çalışması."*

---

## Hafta 1 — Altyapı ve Veri Akışı

**Haftanın hedefi:** Simülatörden çıkan verinin kesintisiz olarak PostgreSQL'e
aktığını görmek.

### Pazartesi — Proje iskeleti ve konteyner ortamı

Projenin sürüm kontrolü (version control) altyapısını kurdum ve klasör yapısını
`simulator/`, `backend/`, `frontend/` olarak ayırdım. PostgreSQL ve Eclipse
Mosquitto servislerini Docker Compose dosyasına tanımlayıp tek komutla ayağa
kaldırdım.

- **Teknoloji:** Git, Docker, Docker Compose
- **Öğrendiğim:** Docker Compose ile birden fazla servisin tek yapılandırma
  dosyasından yönetilmesi; kalıcı veri için volume (birim) kullanımı — konteyner
  silinse bile veritabanı içeriği korunuyor.
- **Çıktı:** `docker compose up` ile 2 servis çalışıyor.

### Salı — Veritabanı şeması

Zaman serisi (time series) veriyi saklayacak şemayı yazdım: `sensors` (sensör
tanımları), `readings` (telemetri kayıtları), `alerts` (sulama uyarıları).
`init.sql` dosyasını Compose'a bağladım; konteyner ilk kez oluşturulurken şema
otomatik kuruluyor ve 5 sanal sensör kaydı ekleniyor.

- **Teknoloji:** PostgreSQL, SQL DDL
- **Öğrendiğim:** `TIMESTAMPTZ` ile saat dilimi bilgisini koruyan zaman damgası;
  `(sensor_id, recorded_at DESC)` bileşik indeksinin (composite index) zaman
  aralıklı sorgularda tablo taramasını (full table scan) önlemesi.
- **Çıktı:** Şema hazır, seed (başlangıç) verisi girildi.

### Çarşamba — Simülatör iskeleti

5 sensör nesnesi ve 10 saniyelik yayın döngüsü kuran simülatörü yazdım; `mqtt`
paketiyle broker'a bağlanıp `farm/sensors/{id}` topic'ine JSON mesaj yayınlıyor.

- **Teknoloji:** Node.js, MQTT
- **Öğrendiğim:** publish/subscribe (yayınla/abone ol) modeli — yayıncı ile
  abonenin birbirini tanıması gerekmez, aracı (broker) üzerinden haberleşirler.
  Topic hiyerarşisi ve `+` / `#` joker karakterleri.
- **Çıktı:** Mesajlar `mosquitto_sub` ile izlenebiliyor.

### Perşembe — Gerçekçilik kuralları

Rastgele sayı üretmek yerine fiziksel davranışı taklit eden bir model kurdum:
toprak nemi her okumada %0,1–0,3 düşüyor (buharlaşma), %22'nin altına inince
%55–65 aralığına sıçrıyor (sulama olayı), sıcaklık günün saatine bağlı sinüs
eğrisi izliyor, pil günde ~%1 azalıyor. 5 sensörün başlangıç değeri ve kuruma
hızı farklı; böylece hepsi aynı anda uyarı üretmiyor.

- **Teknoloji:** Node.js, trigonometrik modelleme
- **Öğrendiğim:** Simülasyonun inandırıcılığı verinin *dağılımından* değil,
  *davranışından* gelir. Grafikte oluşan testere dişi deseni, gerçek bir tarım
  sensörünün kuruma–sulama döngüsünü birebir yansıtıyor.
- **Çıktı:** Grafiğe dökülebilir kalitede veri üretimi.

### Cuma — Backend MQTT abonesi

Backend'i broker'a abone ettim; gelen mesajı doğrulayıp (şema + değer aralığı)
`readings` tablosuna yazıyor. Broker'a herkes yayın yapabildiği için doğrulama
katmanı şart: zorunlu alanlar, tipler, aralıklar ve topic'teki sensör id'sinin
gövdedeki id ile tutarlılığı kontrol ediliyor. Bozuk JSON, aralık dışı değer ve
tanımsız sensör senaryolarını tek tek test ettim.

- **Teknoloji:** Node.js, MQTT (QoS 1), PostgreSQL, `pg` bağlantı havuzu
- **Öğrendiğim:** QoS (hizmet kalitesi) seviyeleri — QoS 1 mesajın en az bir kez
  ulaşmasını garanti eder. Bağlantı havuzu (connection pool), her sorguda yeni
  bağlantı açmanın maliyetini ortadan kaldırıyor. Dış kaynaktan gelen veriye asla
  güvenilmez.
- **Çıktı:** Uçtan uca veri akışı canlı.

---

## Hafta 2 — REST API ve İş Mantığı

**Haftanın hedefi:** Dashboard'un ihtiyaç duyacağı tüm verinin API'den test
edilmiş şekilde sunulması.

### Pazartesi — Express iskeleti ve sensör listesi

`GET /api/sensors` ucunu yazdım: sensör listesini her sensörün son okumasıyla
birlikte döndürüyor. Her sensör için ayrı sorgu atmak yerine `LEFT JOIN LATERAL`
kullandım — bu yapı her sensör için indeksten yalnızca 1 satır okuyor.

- **Teknoloji:** Express, SQL (LATERAL join)
- **Öğrendiğim:** LATERAL join, alt sorgunun dış sorgudaki satıra
  başvurabilmesini sağlar; "her grup için en son kayıt" probleminin standart
  çözümüdür. N+1 sorgu problemi ve tek sorguyla çözümü.
- **Çıktı:** Sensör listesi endpoint'i çalışıyor.

### Salı — Zaman aralıklı sorgular

`GET /readings?range=` ve `GET /stats?range=` uçlarını ekledim. `range`
parametresini doğrudan SQL'e gömmek yerine beyaz liste (whitelist) üzerinden
`INTERVAL` değerine çeviriyorum.

- **Teknoloji:** SQL agregasyon fonksiyonları, parametreli sorgu
- **Öğrendiğim:** SQL injection (SQL enjeksiyonu) — kullanıcıdan gelen değer
  asla sorgu metnine eklenmez; ya parametre olarak geçilir ya da sabit bir
  listeden seçilir. Geçersiz parametre 400 ile reddedilmeli.
- **Çıktı:** Zaman aralıklı sorgular hazır.

### Çarşamba — Uyarı mantığı

Her kayıttan sonra eşik kontrolü yapılıyor: nem %25'in altındaysa `alerts`
tablosuna uyarı düşüyor. Spam önleme için aynı sensörün çözülmemiş uyarısı varsa
yenisi açılmıyor. Kontrol ile ekleme işlemini `NOT EXISTS` ile **tek SQL
cümlesinde** yaptım; ayrı ayrı yapılsaydı iki mesaj arasında çift kayıt
oluşabilirdi.

- **Teknoloji:** SQL (`INSERT ... SELECT ... WHERE NOT EXISTS`)
- **Öğrendiğim:** Yarış durumu (race condition) — "önce kontrol et, sonra yaz"
  deseni eşzamanlı isteklerde bozulur; kontrolü ve yazmayı atomik hale getirmek
  gerekir. Ayrıca uyarı üretimindeki bir hata, okumanın kaydedilmesini
  engellememeli; bu yüzden iki işlemi ayrı hata bloklarına aldım.
- **Çıktı:** Uyarılar otomatik üretiliyor.

### Perşembe — JWT ile kimlik doğrulama

`POST /api/auth/login` ucu doğru kullanıcı/parola için imzalı bir token
üretiyor. `requireAuth` ara katmanı (middleware) `Authorization: Bearer <token>`
başlığını doğruluyor ve tüm veri uçlarını koruyor. `/api/health` ile giriş ucu
bilinçli olarak açık bırakıldı — sağlık kontrolü izleme araçları için erişilebilir
olmalı. Uyarı uçlarını da (`GET /api/alerts`, `PATCH /api/alerts/:id/resolve`)
bu gün tamamladım.

- **Teknoloji:** JWT (JSON Web Token), Express middleware
- **Öğrendiğim:** JWT durum bilgisi tutmayan (stateless) bir yöntemdir; sunucu
  oturum saklamaz, token'ın imzasını doğrulamak yeterlidir. Ara katman deseniyle
  yetkilendirme mantığı tek yerde toplanır. Doğru HTTP durum kodları: 401 yetki,
  404 bulunamadı, 409 çakışma (zaten çözülmüş uyarı).
- **Çıktı:** Korunan, tam API yüzeyi.

### Cuma — Test ve dokümantasyon

Tüm uçları kapsayan bir Postman koleksiyonu hazırladım (12 istek / 19 doğrulama).
Koleksiyon yalnızca başarılı senaryoları değil hata durumlarını da test ediyor:
token'sız erişim, geçersiz `range`, olmayan sensör, zaten çözülmüş uyarı. Giriş
isteğinden dönen token otomatik olarak koleksiyon değişkenine yazılıyor.
Koleksiyonu komut satırından `newman` ile de çalıştırdım.

- **Teknoloji:** Postman, newman, Markdown
- **Öğrendiğim:** API testinde asıl değer hata yollarını (error path) test
  etmektir; mutlu yol zaten geliştirme sırasında farkedilir. Test otomasyonunun
  komut satırından çalışabilmesi, ileride CI'a bağlanabilmesi demek.
- **Çıktı:** Test edilmiş, dokümante API.

---

## Hafta 3 — Dashboard ve Teslim

**Haftanın hedefi:** Gösterilebilir, tek komutla kurulan bitmiş ürün + temiz
dokümantasyon.

### Pazartesi — React kurulumu ve sensör kartları

Vite ile React projesini kurdum; giriş sayfası ve token saklama mantığını yazdım.
Token `localStorage`'da tutuluyor, böylece sayfa yenilendiğinde oturum korunuyor.
Sensör kartları anlık nem, sıcaklık, hava nemi ve pil değerlerini gösteriyor.

- **Teknoloji:** React, Vite, Fetch API
- **Öğrendiğim:** Tek Sayfa Uygulaması (SPA — Single Page Application) mantığı.
  Tüm API çağrılarını tek bir istemci katmanında toplamak, token ekleme ve hata
  yönetimini tek yerden yapmayı sağlıyor.
- **Çıktı:** Kartlar canlı veri gösteriyor.

### Salı — Grafik ekranı

Recharts ile çift eksenli çizgi grafik yaptım: sol eksen toprak nemi (%), sağ
eksen sıcaklık (°C). %25 eşiği kesikli kırmızı referans çizgisiyle işaretlendi.
Sensör seçici ve zaman aralığı seçici (1s / 24s / 7g) eklendi; ekran 15 saniyede
bir kendini yeniliyor.

- **Teknoloji:** Recharts, React `useEffect` / `useCallback`
- **Öğrendiğim:** İki farklı birimi aynı grafikte göstermek için ikinci Y ekseni
  gerekir. React'te zamanlayıcı kuran effect'in temizleme (cleanup) fonksiyonu
  yazılmazsa, bileşen her güncellendiğinde yeni bir zamanlayıcı birikir.
- **Çıktı:** Grafik ekranı bitti.

### Çarşamba — Uyarı paneli ve görsel toparlama

Aktif uyarılar paneli ve 'Çözüldü' butonu eklendi; butona basınca `PATCH` isteği
gidiyor ve liste tazeleniyor. Eşiğin altındaki sensörün kartı kırmızıya dönüyor
ve "Sulama gerekli" rozeti gösteriliyor.

- **Teknoloji:** React durum yönetimi, CSS
- **Öğrendiğim:** Bir dashboard'un işi veriyi *göstermek* değil, dikkat
  çekmektir; renk ve rozet gibi görsel işaretler operatörün ekrana bakma süresini
  saniyelere indiriyor.
- **Çıktı:** Dashboard işlevsel olarak tamam.

### Perşembe — Her şeyi Compose'a taşıma

Backend, simülatör ve frontend için Dockerfile yazdım. Frontend çok aşamalı
(multi-stage) derleniyor: ilk aşamada Vite ile statik dosyalar üretiliyor, ikinci
aşamada yalnızca bu dosyalar nginx imajına kopyalanıyor — sonuç imaj çok daha
küçük oluyor. PostgreSQL'e healthcheck ekledim; backend veritabanı hazır olmadan
başlamıyor. Sistemi `docker compose down -v` ile tamamen silip sıfırdan
ayağa kaldırarak doğruladım.

- **Teknoloji:** Docker (multi-stage build), nginx, Compose healthcheck / depends_on
- **Öğrendiğim:** Konteynerler birbirine servis adıyla erişir (`postgres`,
  `mosquitto`) ama tarayıcı host makinede çalıştığı için yayınlanan portu
  kullanır — bu ayrım ilk bakışta kafa karıştırıcı. Servis başlama sırası
  garanti edilmez; healthcheck olmadan backend hazır olmayan veritabanına
  bağlanmaya çalışır.
- **Çıktı:** Tek komutla kurulan sistem.

### Cuma — Uçtan uca test ve teslim

Sistemi sıfırdan ayağa kaldırıp uzun süre çalıştırdım, grafikte gerçek testere
dişi deseninin oluştuğunu ve uyarıların otomatik üretildiğini doğruladım. Postman
koleksiyonunu Docker'daki API'ye karşı yeniden çalıştırdım. README'yi mimari
şema, kurulum adımları, ekran görüntüleri ve örnek API çağrılarıyla tamamladım.

Bu gün ayrıca bir hata yakaladım: hatalı parola girildiğinde arayüz "Oturum sona
erdi" mesajı gösteriyordu, çünkü istemci katmanı her 401 yanıtını süresi dolmuş
token olarak yorumluyordu. Giriş isteğini ayrı ele alarak düzelttim.

- **Teknoloji:** Docker Compose, newman, Markdown
- **Öğrendiğim:** Aynı HTTP durum kodu bağlama göre farklı anlam taşıyabilir;
  401 giriş ucunda "parola yanlış", diğer uçlarda "token geçersiz" demektir.
  Uçtan uca test, birim testlerin yakalayamadığı bu tür bağlam hatalarını
  ortaya çıkarır.
- **Çıktı:** Teslime hazır proje.

---

## Deftere eklenecek görsel

3. haftanın son günü için mimari şemayı deftere elle çiz: soldan sağa
**Simülatör → Mosquitto → Backend → PostgreSQL**, backend'den yukarı doğru
**REST API (JWT) → React Dashboard**. Görsel içeren sayfalar değerlendirmede öne
çıkıyor.
