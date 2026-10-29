# DeskSpace — Ofis Alanı ve Rezervasyon Yönetimi

DeskSpace; toplantı odalarını, çalışma alanlarını ve rezervasyonları tek panelden yönetmek için geliştirilen orta–ileri seviye bir web uygulamasıdır. Proje, örnek dosyalardaki React + TypeScript + Vite düzeni ile bileşen, hook, tip ve API katmanlarını kullanır; backend tarafında Node.js ve Express tabanlı REST API bulunur.

## Mevcut sürümde bulunanlar

- Genel bakış paneli, günlük rezervasyonlar ve haftalık kullanım grafiği.
- Oda listeleme, arama, filtreleme, ekleme, düzenleme ve silme.
- Rezervasyon ekleme, düzenleme, iptal etme ve silme.
- Oda kapasitesi ve rezervasyon saatleri için sunucu tarafı doğrulama.
- Aynı odada zaman aralığı çakışması kontrolü.
- Rezervasyon oluşturulurken seçilen odanın kapasitesini kontrol etme.
- Verileri `server/data/db.json` dosyasında kalıcı tutma.
- Mobil ve masaüstü ekranlara uyumlu Türkçe arayüz.
- Temel domain kuralları için Node.js testleri.

> Veri deposu bu ilk aşamada kurulum kolaylığı için JSON dosyasıdır. Bir sonraki teknik aşamada PostgreSQL + Prisma'ya taşıyarak ilişkisel veri modeli, güvenli eşzamanlı rezervasyon işlemleri ve kullanıcı/rol yönetimi eklemek için hazırlanmıştır. Bu sürüm üretim ortamı için çok kullanıcılı, kimlik doğrulamalı bir sistem olarak değerlendirilmemelidir.

## Gereksinimler

- Node.js 20 veya üzeri (Node.js 22 önerilir)
- npm

## Windows / PowerShell ile çalıştırma

1. ZIP dosyasını çıkartın ve `deskspace` klasörünü Visual Studio Code ile açın.
2. Terminalde proje klasöründe olduğunuzu kontrol edin:

   ```powershell
   cd C:\projenin\bulundugu\yol\deskspace
   ```

3. Bağımlılıkları yükleyin:

   ```powershell
   npm install
   ```

4. Web arayüzü ve API sunucusunu birlikte başlatın:

   ```powershell
   npm run dev
   ```

5. Tarayıcıda `http://localhost:5173` adresini açın.

İlk açılışta demo odalar ve örnek rezervasyonlar oluşturulur. İlk çalıştırmada `server/data/db.json` dosyası otomatik oluşturulur. Bu dosya uygulama verilerini içerir; sıfırdan demo verisi oluşturmak için uygulamayı durdurup bu dosyayı silebilirsiniz.

API durum kontrolü: `http://localhost:3000/api/health`

## Testler

```powershell
npm test
```

Mevcut testler saat doğrulamasını, rezervasyon alanlarının doğrulanmasını, saat çakışmalarını, farklı odalardaki rezervasyonları, iptal edilmiş rezervasyonları ve oda girdilerini kontrol eder.

## API uç noktaları

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/api/health` | Sunucu sağlık kontrolü |
| GET | `/api/rooms` | Odaları listele |
| POST | `/api/rooms` | Oda oluştur |
| PUT | `/api/rooms/:id` | Odayı güncelle |
| DELETE | `/api/rooms/:id` | Odayı sil; iptal edilmemiş rezervasyon varsa engellenir |
| GET | `/api/reservations` | Rezervasyonları listele; `date` ve `roomId` filtreleri desteklenir |
| POST | `/api/reservations` | Rezervasyon oluştur |
| PUT | `/api/reservations/:id` | Rezervasyonu güncelle |
| PATCH | `/api/reservations/:id/cancel` | Rezervasyonu iptal et |
| DELETE | `/api/reservations/:id` | Rezervasyon kaydını sil |

## Klasör yapısı

```text
deskspace/
├── server/
│   ├── data/                 # İlk çalıştırmada db.json oluşturulur
│   ├── tests/
│   │   └── reservations.test.js
│   ├── domain.js             # Doğrulama ve çakışma kuralları
│   ├── index.js              # Express REST API
│   └── store.js               # JSON veri deposu ve demo verileri
├── src/
│   ├── api/client.ts          # Backend istekleri
│   ├── components/
│   │   ├── ReservationModal.tsx
│   │   └── RoomModal.tsx
│   ├── hooks/useDeskSpace.ts  # Veri yükleme ve CRUD işlemleri
│   ├── types/index.ts         # Room ve Reservation tipleri
│   ├── App.tsx                # Sayfalar ve ana arayüz
│   ├── main.tsx
│   └── styles.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Önerilen geliştirme aşamaları

1. **İlk sürüm:** Arayüz, oda ve rezervasyon CRUD işlemleri, REST API, JSON veri deposu ve testler.
2. **Veritabanı:** PostgreSQL + Prisma modelleri, migration'lar ve transaction tabanlı rezervasyon çakışma koruması.
3. **Güvenlik:** Oturum/JWT tabanlı giriş, yönetici ve çalışan rolleri, kaynak bazlı yetkilendirme.
4. **Gelişmiş rezervasyon:** Tekrarlanan rezervasyonlar, çalışma saatleri, izin günleri, onay akışı ve e-posta bildirimleri.
5. **Kalite ve yayın:** API entegrasyon testleri, erişilebilirlik kontrolleri, Docker ve dağıtım.
