"""
Endpoints Khusus Role: STAFF / OPERATOR DAPUR (KITCHEN DISPLAY SYSTEM)
Sistem Manajemen Pesanan Restoran/Kafe Versi 1.2
Kebutuhan Fungsional: FR-22, FR-23, FR-24, FR-25, FR-26
Aturan Bisnis: BR-02, BR-09, BR-10
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List, Optional

from app.db.database import get_db
from app.models.models import Order, OrderStatus
from app.schemas.schemas import OrderOut
from app.core.deps import require_role
from sqlalchemy import func

router = APIRouter(
    prefix="/dapur", tags=["Role: Dapur"],
    dependencies=[Depends(require_role("dapur"))],
)
# ================= 1. ANTREAN DAPUR HANYA PESANAN DIKONFIRMASI (FR-19, FR-22, BR-09) =================
@router.get("/orders/queue", response_model=List[OrderOut])
def antrean_pesanan_dapur(db: Session = Depends(get_db)):
    """
    FR-19 & FR-22 & BR-09:
    Staff/Operator Dapur HANYA menerima dan melihat pesanan yang TELAH DIKONFIRMASI oleh Kasir.
    Status yang ditampilkan hanya 'Dikonfirmasi' (siap dimasak) dan 'Sedang Diproses'.
    Pesanan berstatus 'Menunggu Konfirmasi Kasir' TIDAK DITAMPILKAN pada antarmuka ini.
    """
    return db.query(Order).filter(
        Order.status.in_([OrderStatus.DIKONFIRMASI, OrderStatus.SEDANG_DIPROSES])
    ).order_by(Order.confirmed_at.asc()).all()


# ================= 2. DETAIL PESANAN & CATATAN KHUSUS (FR-23) =================
@router.get("/orders/{order_id}", response_model=OrderOut)
def detail_pesanan_dapur(order_id: int, db: Session = Depends(get_db)):
    """
    FR-23: Melihat detail pesanan, termasuk daftar item menu, kuantitas,
    dan catatan khusus dari pelanggan (misal: tingkat pedas, tanpa seledri, dll).
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan.")

    if order.status == OrderStatus.MENUNGGU_KONFIRMASI:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pesanan belum dikonfirmasi Kasir dan belum diizinkan masuk ke Dapur (FR-19)."
        )

    return order


# ================= 3. MULAI MEMASAK / PERSIAPAN (FR-24 & BR-10) =================
@router.patch("/orders/{order_id}/start-processing", response_model=OrderOut)
def mulai_memproses_pesanan(order_id: int, db: Session = Depends(get_db)):
    """
    FR-24 & BR-10:
    Staff Dapur memperbarui status pesanan menjadi 'Sedang Diproses' saat persiapan hidangan dimulai.
    Perubahan status ini langsung mengubah status di antarmuka Pelanggan dan Kasir secara real-time.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan.")

    if order.status != OrderStatus.DIKONFIRMASI:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hanya pesanan berstatus 'Dikonfirmasi' yang dapat dimulai proses memasak."
        )

    order.status = OrderStatus.SEDANG_DIPROSES
    order.processing_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return order


# ================= 4. TANDAI PESANAN SELESAI SIAP SAJI (FR-25 & BR-10) =================
@router.patch("/orders/{order_id}/complete", response_model=OrderOut)
def tandai_pesanan_selesai(order_id: int, db: Session = Depends(get_db)):
    """
    FR-25 & BR-10:
    Staff Dapur menandai pesanan sebagai 'Selesai' setelah hidangan siap disajikan ke meja pelanggan.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan.")

    if order.status not in [OrderStatus.DIKONFIRMASI, OrderStatus.SEDANG_DIPROSES]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pesanan belum diproses di dapur atau sudah selesai sebelumnya."
        )

    order.status = OrderStatus.SELESAI
    order.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return order


@router.get("/orders/completed-today", response_model=List[OrderOut])
def pesanan_selesai_hari_ini(target_date: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Menampilkan daftar pesanan yang telah diselesaikan oleh Dapur.
    Jika target_date diberikan (format YYYY-MM-DD), filter sesuai tanggal.
    Jika tidak, tampilkan pesanan selesai hari ini atau pesanan selesai terbaru.
    """
    query = db.query(Order).filter(Order.status == OrderStatus.SELESAI)
    if target_date and target_date.lower() != "all":
        query = query.filter(func.date(func.coalesce(Order.completed_at, Order.created_at)) == target_date)
    else:
        # Default: pesanan selesai hari ini
        today_orders = query.filter(func.date(func.coalesce(Order.completed_at, Order.created_at)) == date.today()).all()
        if today_orders:
            return today_orders
    return query.order_by(func.coalesce(Order.completed_at, Order.created_at).desc()).limit(100).all()