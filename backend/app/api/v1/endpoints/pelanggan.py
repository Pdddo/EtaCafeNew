"""
Endpoints Khusus Role: PELANGGAN (CUSTOMER)
Sistem Manajemen Pesanan Restoran/Kafe Versi 1.2
Kebutuhan Fungsional: FR-01 s.d FR-15
Aturan Bisnis: BR-01, BR-03, BR-04, BR-05, BR-07, BR-12, BR-14
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
import uuid

from app.db.database import get_db
from app.core.deps import get_current_user_optional
from app.models.models import (
    Order, OrderItem, MenuItem, Category, Promo, OrderStatus, OrderType, User
)
from app.schemas.schemas import OrderCreate, OrderOut, MenuItemOut, CategoryOut, PromoOut

router = APIRouter(prefix="/pelanggan", tags=["Role: Pelanggan"])


# ================= 0. KATEGORI & PROMO AKTIF (PUBLIK) =================
@router.get("/categories", response_model=List[CategoryOut])
def get_kategori_menu(db: Session = Depends(get_db)):
    """
    Menampilkan daftar seluruh kategori menu untuk tab filter di frontend pelanggan.
    """
    return db.query(Category).all()


@router.get("/promos", response_model=List[PromoOut])
def get_promo_aktif(db: Session = Depends(get_db)):
    """
    Menampilkan daftar voucher promo yang sedang aktif untuk digunakan pelanggan.
    """
    return db.query(Promo).filter(Promo.is_active == True).all()


# ================= 1. KATALOG MENU (FR-03 & FR-04) (PUBLIK) =================
@router.get("/menu", response_model=List[MenuItemOut])
def get_katalog_menu(
    kategori_id: Optional[int] = Query(None, description="Filter menu berdasarkan kategori"),
    search: Optional[str] = Query(None, description="Cari nama atau deskripsi menu"),
    db: Session = Depends(get_db)
):
    """
    FR-03: Menampilkan daftar menu makanan/minuman beserta kategori, harga, ketersediaan, dan gambar.
    """
    query = db.query(MenuItem)
    if kategori_id:
        query = query.filter(MenuItem.category_id == kategori_id)
    if search:
        query = query.filter(MenuItem.name.ilike(f"%{search}%"))
    return query.all()


@router.get("/menu/{menu_id}", response_model=MenuItemOut)
def get_detail_menu(menu_id: int, db: Session = Depends(get_db)):
    """
    FR-04: Menampilkan detail suatu item menu tertentu.
    """
    menu = db.query(MenuItem).filter(MenuItem.id == menu_id).first()
    if not menu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item menu tidak ditemukan."
        )
    return menu


# ================= 2. PEMESANAN & CHECKOUT (FR-05..08, FR-13..14, BR-01, BR-04, BR-05, BR-07, BR-12, BR-14) =================
@router.post("/orders", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def checkout_pesanan(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """
    FR-07: Checkout pesanan (pilihan langsung di tempat atau QR Code Meja).
    FR-08 & BR-12: Simulasi pembayaran otomatis berhasil.
    FR-13: Catatan khusus per item disimpan.
    FR-14 & BR-05: Total = (Subtotal - Diskon) + Pajak (10%) + Biaya Layanan (5%).
    BR-01: Pesanan baru otomatis berstatus 'Menunggu Konfirmasi Kasir'.
    BR-04 & FR-09: Keranjang kosong dilarang checkout.
    BR-07: Item tidak tersedia dilarang dimasukkan ke keranjang.
    BR-14: Pemesanan via QR Code meja otomatis menyertakan nomor meja.
    """
    # Validasi keranjang belanja kosong (FR-09 & BR-04)
    if not payload.items or len(payload.items) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Keranjang belanja kosong! Silakan pilih menu terlebih dahulu."
        )

    # Validasi tipe pesanan
    if payload.order_type not in (OrderType.LANGSUNG, OrderType.QR_MEJA):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipe pesanan tidak valid. Gunakan 'langsung' atau 'qr_meja'."
        )

    # Validasi nomor meja jika metode QR Meja (BR-14)
    if payload.order_type == OrderType.QR_MEJA and not payload.table_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pemesanan melalui QR Code meja wajib menyertakan nomor meja."
        )

    subtotal = 0.0
    items_to_create = []

    for item_data in payload.items:
        menu = db.query(MenuItem).filter(MenuItem.id == item_data.menu_item_id).first()
        if not menu:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Menu dengan ID {item_data.menu_item_id} tidak ditemukan."
            )

        # Validasi ketersediaan menu (BR-07)
        if not menu.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Menu '{menu.name}' sedang tidak tersedia dan tidak dapat dipesan."
            )

        item_subtotal = menu.price * item_data.quantity
        subtotal += item_subtotal
        item_notes = item_data.notes or getattr(item_data, "custom_notes", None)

        items_to_create.append(
            OrderItem(
                menu_item_id=menu.id,
                item_name=menu.name,
                price=menu.price,
                quantity=item_data.quantity,
                notes=item_notes,  # FR-13: Catatan khusus
                subtotal=item_subtotal
            )
        )

    # Perhitungan Diskon Promo
    discount_amount = 0.0
    promo_code_applied = None
    if payload.promo_code:
        promo = db.query(Promo).filter(
            Promo.code == payload.promo_code.strip().upper(),
            Promo.is_active == True
        ).first()
        if promo and subtotal >= promo.min_order:
            promo_code_applied = promo.code
            if promo.discount_type == "percentage":
                discount_amount = (subtotal * promo.discount_value) / 100.0
            else:
                discount_amount = min(promo.discount_value, subtotal)

    # Rumus Total Pembayaran (BR-05 & FR-14)
    taxable_amount = max(0.0, subtotal - discount_amount)
    tax_amount = round(taxable_amount * 0.10, 2)    # Pajak Resto 10%
    service_fee = round(taxable_amount * 0.05, 2)   # Biaya Layanan 5%
    total_amount = round(taxable_amount + tax_amount + service_fee, 2)

    order_number = f"RF-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"

    customer_id = user.id if user else None

    order = Order(
        customer_id=customer_id,
        order_number=order_number,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        order_type=payload.order_type,
        table_number=payload.table_number if payload.order_type == OrderType.QR_MEJA else None,  # BR-14
        subtotal=subtotal,
        discount_amount=discount_amount,
        promo_code=promo_code_applied,
        tax_amount=tax_amount,
        service_fee=service_fee,
        total_amount=total_amount,
        payment_method=payload.payment_method,
        payment_status="Berhasil (Simulasi)",           # BR-12
        status=OrderStatus.MENUNGGU_KONFIRMASI,         # BR-01
        created_at=datetime.utcnow(),
        items=items_to_create
    )

    db.add(order)
    db.commit()
    db.refresh(order)
    return order


# ================= 3. PELACAKAN STATUS & RIWAYAT (FR-10, FR-11, FR-12) =================
@router.get("/orders/history", response_model=List[OrderOut])
def riwayat_pesanan_pelanggan(
    customer_phone: Optional[str] = Query(None, description="Nomor telepon pemesan"),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """
    FR-11 & FR-12: Menampilkan riwayat seluruh pesanan milik pelanggan yang sedang login,
    atau berdasarkan nomor telepon pelanggan.
    """
    query = db.query(Order)
    if user and user.role == "pelanggan":
        query = query.filter(Order.customer_id == user.id)
    elif customer_phone:
        query = query.filter(Order.customer_phone == customer_phone)

    return query.order_by(Order.created_at.desc()).all()


@router.get("/orders/{order_id}/status", response_model=OrderOut)
def lacak_status_pesanan(
    order_id: int,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """
    FR-10: Memantau status pesanan real-time:
    - Menunggu Konfirmasi Kasir
    - Dikonfirmasi
    - Sedang Diproses
    - Selesai
    - Dibatalkan
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan.")

    # Jika user login sebagai pelanggan dan pesanan memiliki customer_id, pastikan milik sendiri
    if user and user.role == "pelanggan" and order.customer_id and order.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke pesanan ini.")

    return order


# ================= 4. PEMBATALAN MANDIRI (FR-15 & BR-03) =================
@router.post("/orders/{order_id}/cancel", response_model=OrderOut)
def batalkan_pesanan_mandiri(
    order_id: int,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """
    FR-15 & BR-03:
    Pelanggan HANYA dapat membatalkan pesanan secara mandiri selama status
    pesanan masih 'Menunggu Konfirmasi Kasir'.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan.")

    if user and user.role == "pelanggan" and order.customer_id and order.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Anda tidak memiliki izin membatalkan pesanan ini.")

    if order.status != OrderStatus.MENUNGGU_KONFIRMASI:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pesanan sudah dikonfirmasi Kasir atau diproses Dapur, sehingga tidak dapat dibatalkan lagi (BR-03)."
        )

    order.status = OrderStatus.DIBATALKAN
    order.cancelled_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return order
