"""
Entry Point Utama FastAPI Server - Sistem Manajemen Pesanan Restoran/Kafe Versi 1.2
Departemen Matematika - Program Studi Sistem Informasi FMIPA Universitas Hasanuddin 2026
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import engine, Base
from app.api.v1.endpoints import auth, pelanggan, kasir, dapur, manajer

# Otomatis membuat semua tabel jika belum ada
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend REST API berbasis FastAPI dengan pemisahan router per role: Pelanggan, Kasir, Dapur, Manajer."
)

# Konfigurasi CORS Middleware agar frontend React dapat berkomunikasi
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrasi Router Berdasarkan Role
app.include_router(auth.router, prefix="/api/v1")
app.include_router(pelanggan.router, prefix="/api/v1")
app.include_router(kasir.router, prefix="/api/v1")
app.include_router(dapur.router, prefix="/api/v1")
app.include_router(manajer.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "status": "online",
        "message": "EtaCafe API Backend berjalan lancar.",
        "docs_url": "/docs",
        "endpoints_by_role": {
            "autentikasi": "/api/v1/auth",
            "pelanggan": "/api/v1/pelanggan",
            "kasir": "/api/v1/kasir",
            "dapur": "/api/v1/dapur",
            "manajer": "/api/v1/manajer"
        },
        "version": settings.VERSION
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}
