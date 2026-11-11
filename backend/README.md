# RestoFlow - Backend FastAPI & PostgreSQL
Sistem Manajemen Pesanan Restoran/Kafe Versi 1.2
Departemen Matematika - Program Studi Sistem Informasi
FMIPA Universitas Hasanuddin 2026

Dosen Pengampu: Dr. Hendra, S.Si., M.Kom.

Disusun oleh:
- Kevin Anugrah Somakila’ [H071241005]
- Ahmad Rizky Amis [H071241007]
- Hilmy Affayyad Akbar [H071241013]
- Agung Allo Karaeng [H071241020]
- As’syiekril Fikryan Sarda [H071241083]

---

## Cara Menjalankan Backend FastAPI:

### 1. Buat & Aktifkan Virtual Environment Python:
```bash
python -m venv venv

# Windows (Command Prompt / PowerShell):
venv\Scripts\activate

# macOS / Linux:
source venv/bin/activate
```

### 2. Pasang Dependensi:
```bash
pip install -r requirements.txt
```

### 3. Jalankan Database PostgreSQL:
Jalankan Docker Compose:
```bash
docker compose up -d
```
Atau gunakan PostgreSQL lokal dengan membuat database bernama `restoflow_db`.

### 4. Salin Variabel Lingkungan:
```bash
copy .env.example .env    # Windows
cp .env.example .env      # macOS/Linux
```

### 5. Jalankan Server FastAPI:
```bash
uvicorn app.main:app --reload --port 8000
```

### 6. Akses Dokumentasi Swagger:
Buka di browser: `http://localhost:8000/docs`
