"""
Endpoints Khusus Role: KASIR (CASHIER)
Sistem Manajemen Pesanan Restoran/Kafe Versi 1.2
Kebutuhan Fungsional: FR-16, FR-17, FR-18, FR-19, FR-20, FR-21
Aturan Bisnis: BR-01, BR-02, BR-08, BR-09, BR-14
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from app.db.database import get_db
from app.models.models import Order, OrderStatus
from app.schemas.schemas import OrderOut
from app.core.deps import require_role

router = APIRouter(
    prefix="/kasir",
    tags=["Role: Kasir"],
    dependencies=[Depends(require_role("kasir"))],
)

# ================= 1. ANTREAN PESANAN MASUK (FR-16 & BR-01) =================
@router.get("/orders/queue", response_model=List[OrderOut])
def antrean_pesanan_masuk_kasir(
    status_filter: Optional[str] = Query(None, description="Filter status pesanan: 'all', 'menunggu', 'dikonfirmasi', 'proses', 'selesai'"),
    db: Session = Depends(get_db)
):
    """
    FR-16: Menampilkan daftar pesanan kepada Kasir secara real-time.
    Default status: 'Menunggu Konfirmasi Kasir'.
    Mendukung filter: 'dikonfirmasi', 'proses', 'selesai', atau 'all'.
    """
    query = db.query(Order)
    if not status_filter or status_filter == "menunggu":
        query = query.filter(Order.status == OrderStatus.MENUNGGU_KONFIRMASI)
    elif status_filter == "dikonfirmasi":
        query = query.filter(Order.status == OrderStatus.DIKONFIRMASI)
    elif status_filter in ("proses", "sedang_diproses"):
        query = query.filter(Order.status == OrderStatus.SEDANG_DIPROSES)
    elif status_filter == "selesai":
        query = query.filter(Order.status == OrderStatus.SELESAI)
    
    return query.order_by(Order.created_at.desc()).all()


# ================= 2. DETAIL PESANAN MASUK (FR-17 & BR-14) =================
@router.get("/orders/{order_id}", response_model=OrderOut)
def detail_pesanan_kasir(order_id: int, db: Session = Depends(get_db)):
    """
    FR-17: Melihat detail setiap pesanan masuk, termasuk metode pemesanan
    dan lokasi/meja jika berasal dari QR Code meja (BR-14).
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pesanan tidak ditemukan."
        )
    return order


# ================= 3. KONFIRMASI PESANAN (FR-18, FR-20, BR-02, BR-09) =================
@router.post("/orders/{order_id}/confirm", response_model=OrderOut)
def konfirmasi_pesanan_kasir(order_id: int, db: Session = Depends(get_db)):
    """
    FR-18 & FR-20: Kasir mengonfirmasi pesanan dan sistem mencatat waktu konfirmasi (confirmed_at).
    BR-02 & BR-09: Pesanan TIDAK AKAN diteruskan ke Dapur sebelum Kasir menekan konfirmasi ini.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pesanan tidak ditemukan."
        )

    if order.status != OrderStatus.MENUNGGU_KONFIRMASI:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pesanan ini sudah dikonfirmasi atau telah dibatalkan."
        )

    order.status = OrderStatus.DIKONFIRMASI
    order.confirmed_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return order


# ================= 4. CETAK STRUK TRANSAKSI (FR-21 & BR-08) =================
@router.get("/orders/{order_id}/receipt")
def cetak_struk_transaksi(order_id: int, db: Session = Depends(get_db)):
    """
    FR-21 & BR-08:
    Kasir dapat mencetak/menghasilkan bukti transaksi (struk) HANYA SETELAH pesanan dikonfirmasi.
    Jika pesanan masih 'Menunggu Konfirmasi Kasir', pencetakan struk akan ditolak sistem.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan.")

    if order.status == OrderStatus.MENUNGGU_KONFIRMASI:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Struk transaksi dilarang dicetak sebelum pesanan dikonfirmasi oleh Kasir (BR-08)."
        )

    return {
        "restoran": "EtaCafe Restoran & Kafe",
        "alamat": "Jl. Perintis Kemerdekaan KM. 10 Tamalanrea, Makassar",
        "no_pesanan": order.order_number,
        "tipe_pesanan": order.order_type,
        "meja": order.table_number or "Langsung Kasir",
        "pelanggan": order.customer_name,
        "waktu_pesan": order.created_at,
        "waktu_konfirmasi": order.confirmed_at,
        "items": [
            {
                "nama_menu": it.item_name,
                "jumlah": it.quantity,
                "harga_satuan": it.price,
                "subtotal": it.subtotal,
                "catatan": it.notes
            }
            for it in order.items
        ],
        "subtotal": order.subtotal,
        "diskon": order.discount_amount,
        "kode_promo": order.promo_code,
        "pajak_10_persen": order.tax_amount,
        "biaya_layanan_5_persen": order.service_fee,
        "total_bayar": order.total_amount,
        "metode_pembayaran": order.payment_method,
        "status_pembayaran": order.payment_status,
        "status_pesanan": order.status
    }
