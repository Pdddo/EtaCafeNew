# ☕ EtaCafe - Sistem Manajemen Pemesanan Kafe

Aplikasi Fullstack Manajemen Pemesanan Kafe/Restoran modern berbasis **FastAPI (Backend)**, **PostgreSQL (Database)**, dan **React + TypeScript + Vite (Frontend)**. Proyek ini dirancang dengan arsitektur role-based (*Pelanggan*, *Kasir*, *Dapur*, dan *Manajer*) sesuai spesifikasi SRS (Software Requirements Specification).

---

## 🚀 Fitur Utama Berdasarkan Role

1. **Pelanggan (Customer)**
   - Jelajah katalog menu berdasarkan kategori & pencarian.
   - Pemesanan langsung atau melalui QR Code Meja.
   - Penerapan kode voucher promo (persentase & nominal).
   - Catatan kustom per menu (cth: *less sugar*, *level pedas*).
   - Pelacakan status pesanan secara real-time.
   - Pembatalan pesanan mandiri sebelum pesanan dikonfirmasi kasir.

2. **Kasir (Cashier)**
   - Dashboard antrean pesanan masuk.
   - Konfirmasi pesanan dan verifikasi pembayaran.
   - Fitur pembatalan pesanan bermasalah.

3. **Dapur (Kitchen Display System - KDS)**
   - Antrean pesanan terkonfirmasi dari kasir.
   - Update status pengerjaan pesanan (*Sedang Diproses* -> *Selesai*).

4. **Manajer (Manager)**
   - Manajemen Master Menu & Kategori (CRUD, atur ketersediaan & harga).
   - Manajemen Kupon Diskon / Promo.
   - Laporan ringkasan penjualan & produk terlaris.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Pydantic, Uvicorn, Bcrypt, PyJWT
- **Frontend**: React, TypeScript, Vite, Tailwind CSS / Vanilla CSS
- **Database**: PostgreSQL

---

## 📋 Prasyarat Sistem

- Python 3.10 / 3.11+
- Node.js 18+ atau Bun
- PostgreSQL 14+ (Running di port `5432`)
- Git

---

## ⚙️ Panduan Instalasi & Menjalankan Proyek

### 1. Clone Repository
```bash
git clone https://github.com/Pdddo/EtaCafe.git
cd EtaCafe
```

---

### 2. Setup Backend (FastAPI & PostgreSQL)

1. **Pindah ke direktori backend:**
   ```bash
   cd backend
   ```

2. **Buat dan aktifkan Virtual Environment:**
   - **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependensi Python:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Konfigurasi Environment Variable (`.env`):**
   Salin `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Buka file `.env` dan sesuaikan koneksi database PostgreSQL Anda:
   ```env
   DATABASE_URL=postgresql+psycopg2://postgres:password_anda@localhost:5432/EtaCafe_db
   ```
   *(Pastikan database `EtaCafe_db` sudah dibuat di PostgreSQL/DBeaver)*.

5. **Inisialisasi Tabel & Data Awal (Seed Data):**
   ```bash
   python init_db.py
   ```
   *Script ini akan otomatis meng-generate tabel dan data awal (kategori, 10 item menu, promo, serta 4 akun pengguna untuk tiap role).*

6. **Jalankan Backend Server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - **API Server:** `http://localhost:8000`
   - **Dokumentasi Swagger UI:** `http://localhost:8000/docs`
   - **Dokumentasi ReDoc:** `http://localhost:8000/redoc`

---

### 3. Setup Frontend (React + Vite)

1. **Buka terminal baru di root folder proyek:**
   ```bash
   cd EtaCafe
   ```

2. **Install dependensi frontend:**
   ```bash
   npm install
   # Atau jika memakai bun:
   bun install
   ```

3. **Jalankan Frontend Dev Server:**
   ```bash
   npm run dev
   # Atau:
   bun dev
   ```
   Aplikasi frontend dapat diakses di: **`http://localhost:5173`**

---

## 🔑 Akun Uji Coba Default (Seed Data)

Semua akun pengujian di bawah ini menggunakan password default: **`rahasia123`**

| Role | Email / Username | Password |
|---|---|---|
| **Pelanggan** | `kevin@etacafe.com` | `rahasia123` |
| **Kasir** | `kasir@etacafe.com` | `rahasia123` |
| **Dapur** | `dapur@etacafe.com` | `rahasia123` |
| **Manajer** | `manajer@etacafe.com` | `rahasia123` |

---

## 🎟️ Kupon Promo Tersedia

- `ETASPESIAL10` : Diskon 10% (Minimal pembelian Rp 40.000)
- `HEMAT5RB` : Potongan langsung Rp 5.000 (Minimal pembelian Rp 25.000)

---

## 📂 Struktur Direktori Proyek

```text
EtaCafe/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/ # Router per role (auth, pelanggan, kasir, dapur, manajer)
│   │   ├── core/             # Konfigurasi JWT & Security
│   │   ├── db/               # Koneksi database SQLAlchemy
│   │   ├── models/           # Definisi model ORM PostgreSQL
│   │   └── schemas/          # Skema Pydantic untuk request & response
│   ├── init_db.py            # Skrip pembuat tabel & seed data otomatis
│   ├── requirements.txt      # Dependensi Python
│   └── .env.example          # Template konfigurasi environment
├── src/                      # Source code React Frontend
├── catatan.txt               # Catatan instruksi singkat tim
├── package.json              # Konfigurasi dependensi frontend
├── README.md                 # Dokumentasi proyek
└── vite.config.ts            # Konfigurasi Vite
```
