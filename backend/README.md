# Nestra - Universal Cutting Optimization System

🔧 Evrensel Kesim Planlama ve Optimizasyon Sistemi

## 📋 Özellikler

- **1D Kesim Optimizasyonu**: Çubuk, profil, boru, şerit malzemeler için
- **2D Kesim Optimizasyonu**: Dikdörtgen plaka, daire, kare, çokgen şekiller için
- **Çoklu Malzeme Desteği**: SAC, AHŞAP, GALVANİZ, KARTON, PLASTİK, ALÜMİNYUM
- **Stok Yönetimi**: Giriş, çıkış, hareket takibi
- **Sipariş Yönetimi**: Manuel giriş ve dosyadan içe aktarma
- **Optimizasyon Senaryoları**: Farklı hedef ve kısıtlarla karşılaştırmalı planlama
- **Üretim Takibi**: Plan uygulama ve sapma raporlama
- **Rol Tabanlı Erişim**: Admin, Planlamacı, Operatör, Yönetici

## 🏗️ Mimari

Sistem **SOLID prensiplerine** uygun **mikroservis mimarisi** ile tasarlanmıştır:

```
backend/
├── src/
│   ├── core/                    # Çekirdek yapılar
│   │   ├── interfaces/          # Arayüzler (ISP)
│   │   ├── di/                  # Dependency Injection (DIP)
│   │   └── repositories/        # Base Repository (OCP)
│   ├── modules/                 # Modüller (SRP)
│   │   ├── auth/               # Kimlik doğrulama
│   │   ├── material/           # Malzeme yönetimi
│   │   ├── stock/              # Stok yönetimi
│   │   ├── order/              # Sipariş yönetimi
│   │   └── optimization/       # Kesim optimizasyonu
│   ├── algorithms/             # Optimizasyon algoritmaları
│   │   ├── 1d/                 # 1D kesim (FFD, BFD)
│   │   └── 2d/                 # 2D kesim (Bottom-Left, Guillotine)
│   └── middleware/             # Express middleware
└── prisma/
    ├── schema.prisma           # Veritabanı şeması
    └── seed.ts                 # Başlangıç verileri
```

### SOLID Prensipleri

| Prensip | Uygulama |
|---------|----------|
| **S** - Single Responsibility | Her modül tek bir sorumluluk (Repository, Service, Controller) |
| **O** - Open/Closed | Strategy pattern ile yeni algoritmalar eklenebilir |
| **L** - Liskov Substitution | Interface'ler üzerinden alt sınıf değişimi |
| **I** - Interface Segregation | Küçük, odaklı interface'ler |
| **D** - Dependency Inversion | DI container ile bağımlılık enjeksiyonu |

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL 14+
- npm veya yarn

### Adımlar

```bash
# 1. Backend dizinine git
cd backend

# 2. Bağımlılıkları yükle
npm install

# 3. .env dosyasını oluştur
cp .env.example .env
# DATABASE_URL'i kendi PostgreSQL bağlantınızla güncelleyin

# 4. Veritabanını oluştur ve migrate et
npx prisma migrate dev

# 5. Prisma client'ı generate et
npx prisma generate

# 6. Seed verilerini yükle
npm run prisma:seed

# 7. Uygulamayı başlat
npm run dev
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - Giriş
- `POST /api/auth/register` - Kayıt
- `POST /api/auth/logout` - Çıkış

### Materials
- `GET /api/materials` - Malzeme listesi
- `POST /api/materials` - Yeni malzeme
- `PUT /api/materials/:id` - Malzeme güncelle
- `DELETE /api/materials/:id` - Malzeme sil

### Stock
- `GET /api/stock` - Stok listesi
- `POST /api/stock` - Stok girişi
- `POST /api/stock/movements` - Stok hareketi

### Orders
- `GET /api/orders` - Sipariş listesi
- `POST /api/orders` - Yeni sipariş
- `POST /api/orders/import` - Dosyadan içe aktar

### Optimization
- `POST /api/optimization/scenarios` - Senaryo oluştur
- `POST /api/optimization/scenarios/:id/run` - Optimizasyon çalıştır
- `GET /api/optimization/plans` - Kesim planları
- `POST /api/optimization/plans/:id/approve` - Plan onayla

## 🔒 Varsayılan Kullanıcı

```
Email: admin@nestra.com
Şifre: admin123
```

## 📦 Teknolojiler

- **Backend**: Node.js, Express, TypeScript
- **ORM**: Prisma
- **Veritabanı**: PostgreSQL
- **Authentication**: JWT
- **Dosya İşleme**: xlsx, multer

## 📄 Lisans

MIT License
