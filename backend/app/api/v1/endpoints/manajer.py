"""
Endpoints Khusus Role: MANAJER (MANAGER)
Sistem Manajemen Pesanan Restoran/Kafe Versi 1.2
Kebutuhan Fungsional: FR-27, FR-28, FR-29, FR-30, FR-31, FR-32, FR-33, FR-34, FR-35, FR-36, FR-37, FR-38, FR-39
Aturan Bisnis: BR-06, BR-07, BR-11, BR-13

Perbaikan keamanan & stabilitas:
- Seluruh endpoint hanya untuk role 'manajer' (NFR-04 & NFR-05).
- Hapus menu yang sudah pernah dipesan -> otomatis dinonaktifkan (bukan error 500).
- Hapus kategori yang masih punya menu -> ditolak dengan pesan jelas.
- Hapus pengguna: tidak boleh akun sendiri, tidak boleh manajer terakhir,
  dan tidak boleh jika pengguna sudah punya riwayat pesanan.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List
import io
import csv

from app.db.database import get_db
from app.models.models import MenuItem, Category, Promo, User, Order, OrderItem, OrderStatus
from app.schemas.schemas import (
    MenuItemCreate,
    MenuItemUpdate,
    MenuItemOut,
    CategoryCreate,
    CategoryOut,
    PromoCreate,
    PromoOut,
    UserCreate,
    UserOut,
    SalesReportSummary,
)
from app.core.security import get_password_hash
from app.core.deps import require_role

router = APIRouter(
    prefix="/manajer", tags=["Role: Manajer"],
    dependencies=[Depends(require_role("manajer"))],
)


def _pastikan_kategori_ada(db: Session, category_id: int):
    """Validasi bahwa kategori yang dipilih benar-benar ada."""
    if not db.query(Category).filter(Category.id == category_id).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Kategori dengan ID {category_id} tidak ditemukan."
        )


# ================= 1. MANAJEMEN MASTER MENU (FR-27..30, FR-34, BR-06, BR-07) =================
@router.get("/menus", response_model=List[MenuItemOut])
def daftar_seluruh_menu(db: Session = Depends(get_db)):
    """FR-27: Manajer melihat daftar seluruh menu beserta status ketersediaan."""
    return db.query(MenuItem).all()

@router.post("/menus", response_model=MenuItemOut, status_code=status.HTTP_201_CREATED)
def tambah_menu_baru(payload: MenuItemCreate, db: Session = Depends(get_db)):
    """FR-27 & BR-06: Manajer menambah data menu baru."""
    _pastikan_kategori_ada(db, payload.category_id)
    menu = MenuItem(**payload.model_dump())
    db.add(menu)
    db.commit()
    db.refresh(menu)
    return menu

@router.put("/menus/{menu_id}", response_model=MenuItemOut)
def ubah_data_menu(menu_id: int, payload: MenuItemUpdate, db: Session = Depends(get_db)):
    """FR-28, FR-30 & BR-06: Manajer mengubah data menu dan mengatur harga."""
    menu = db.query(MenuItem).filter(MenuItem.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Item menu tidak ditemukan.")

    data = payload.model_dump(exclude_unset=True)
    if "category_id" in data and data["category_id"] is not None:
        _pastikan_kategori_ada(db, data["category_id"])

    for key, val in data.items():
        setattr(menu, key, val)
    db.commit()
    db.refresh(menu)
    return menu

@router.patch("/menus/{menu_id}/availability", response_model=MenuItemOut)
def atur_ketersediaan_menu(menu_id: int, is_available: bool, db: Session = Depends(get_db)):
    """
    FR-34 & BR-07:
    Manajer mengatur ketersediaan menu secara langsung (menandai item menu tersedia atau tidak tersedia).
    Item yang ditandai 'Tidak Tersedia' dilarang dipesan oleh pelanggan.
    """
    menu = db.query(MenuItem).filter(MenuItem.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Item menu tidak ditemukan.")
    menu.is_available = is_available
    db.commit()
    db.refresh(menu)
    return menu

@router.delete("/menus/{menu_id}")
def hapus_menu(menu_id: int, db: Session = Depends(get_db)):
    """
    FR-29 & BR-06: Manajer menghapus data menu.

    - Menu yang BELUM pernah dipesan  -> dihapus permanen.
    - Menu yang SUDAH ada di riwayat pesanan -> TIDAK dihapus (agar riwayat & laporan
      tetap utuh), melainkan ditandai 'Tidak Tersedia' (is_available = False).
    """
    menu = db.query(MenuItem).filter(MenuItem.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Item menu tidak ditemukan.")

    pernah_dipesan = db.query(OrderItem).filter(OrderItem.menu_item_id == menu_id).first()
    if pernah_dipesan:
        menu.is_available = False
        db.commit()
        return {
            "deleted": False,
            "deactivated": True,
            "message": f"Menu '{menu.name}' sudah pernah dipesan sehingga tidak dihapus permanen. "
                       f"Menu ditandai 'Tidak Tersedia' sehingga tidak dapat dipesan lagi."
        }

    nama = menu.name
    db.delete(menu)
    db.commit()
    return {
        "deleted": True,
        "deactivated": False,
        "message": f"Menu '{nama}' berhasil dihapus."
    }


# ================= 2. MANAJEMEN MASTER KATEGORI (FR-31) =================
@router.get("/categories", response_model=List[CategoryOut])
def daftar_kategori(db: Session = Depends(get_db)):
    """FR-31: Melihat seluruh kategori menu."""
    return db.query(Category).all()

@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def tambah_kategori(payload: CategoryCreate, db: Session = Depends(get_db)):
    """FR-31: Menambah kategori menu baru."""
    category = Category(name=payload.name, slug=payload.slug)
    db.add(category)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Nama atau slug kategori sudah dipakai.")
    db.refresh(category)
    return category

@router.put("/categories/{category_id}", response_model=CategoryOut)
def ubah_kategori(category_id: int, payload: CategoryCreate, db: Session = Depends(get_db)):
    """FR-31: Mengubah kategori menu."""
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan.")
    cat.name = payload.name
    cat.slug = payload.slug
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Nama atau slug kategori sudah dipakai.")
    db.refresh(cat)
    return cat

@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def hapus_kategori(category_id: int, db: Session = Depends(get_db)):
    """
    FR-31: Menghapus kategori menu.
    Kategori yang masih memiliki menu TIDAK boleh dihapus, agar menu (dan riwayat
    pesanannya) tidak ikut hilang. Pindahkan atau nonaktifkan menunya terlebih dahulu.
    """
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan.")

    jumlah_menu = db.query(MenuItem).filter(MenuItem.category_id == category_id).count()
    if jumlah_menu > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Kategori '{cat.name}' masih memiliki {jumlah_menu} menu. "
                   f"Pindahkan menu tersebut ke kategori lain terlebih dahulu."
        )

    db.delete(cat)
    db.commit()
    return None


# ================= 3. MANAJEMEN PENGGUNA (FR-32, FR-33, BR-11: TAMBAH & HAPUS SAJA) =================
@router.get("/users", response_model=List[UserOut])
def daftar_pengguna(db: Session = Depends(get_db)):
    """Melihat seluruh pengguna sistem (Pelanggan, Kasir, Dapur, Manajer)."""
    return db.query(User).all()

@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def tambah_pengguna(payload: UserCreate, db: Session = Depends(get_db)):
    """
    FR-32: Manajer menambah user yang terdiri dari Pelanggan, Kasir, Staff/Operator Dapur, dan Manajer.
    Kata sandi di-hash dengan bcrypt (NFR-03).
    """
    existing = db.query(User).filter(User.email_or_phone == payload.email_or_phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email atau nomor telepon sudah terdaftar.")

    user = User(
        name=payload.name,
        email_or_phone=payload.email_or_phone,
        hashed_password=get_password_hash(payload.password),
        role=payload.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def hapus_pengguna(
    user_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("manajer")),
):
    """
    FR-32 & BR-11: Manajer menghapus data pengguna.
    CATATAN ATURAN BISNIS BR-11 & FR-33:
    'Manajer dapat menambah atau menghapus data pengguna (user), tetapi TIDAK DIIZINKAN mengubah (edit) data pengguna yang sudah ada.'
    Oleh karena itu tidak ada endpoint PUT/PATCH untuk user!

    Pengaman tambahan:
    - Manajer tidak boleh menghapus akunnya sendiri.
    - Sistem tidak boleh kehilangan manajer terakhir.
    - Pengguna yang sudah memiliki riwayat pesanan tidak boleh dihapus
      (menjaga integritas riwayat & laporan penjualan).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan.")

    if user.id == current.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Anda tidak dapat menghapus akun Anda sendiri."
        )

    if user.role == "manajer":
        jumlah_manajer = db.query(User).filter(User.role == "manajer").count()
        if jumlah_manajer <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tidak dapat menghapus manajer terakhir."
            )

    punya_pesanan = db.query(Order).filter(Order.customer_id == user_id).first()
    if punya_pesanan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pengguna '{user.name}' sudah memiliki riwayat pesanan sehingga tidak dapat dihapus."
        )

    db.delete(user)
    db.commit()
    return None


# ================= 4. MANAJEMEN PROMO / DISKON (FR-35) =================
@router.get("/promos", response_model=List[PromoOut])
def daftar_promo(db: Session = Depends(get_db)):
    """FR-35: Melihat daftar promo atau diskon."""
    return db.query(Promo).all()

@router.post("/promos", response_model=PromoOut, status_code=status.HTTP_201_CREATED)
def tambah_promo(payload: PromoCreate, db: Session = Depends(get_db)):
    """FR-35: Menambah promo baru."""
    promo = Promo(**payload.model_dump())
    promo.code = promo.code.upper()
    db.add(promo)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Kode promo sudah dipakai.")
    db.refresh(promo)
    return promo

@router.put("/promos/{promo_id}", response_model=PromoOut)
def ubah_promo(promo_id: int, payload: PromoCreate, db: Session = Depends(get_db)):
    """FR-35: Mengubah data promo."""
    promo = db.query(Promo).filter(Promo.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promo tidak ditemukan.")
    for k, v in payload.model_dump().items():
        setattr(promo, k, v)
    promo.code = promo.code.upper()
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Kode promo sudah dipakai.")
    db.refresh(promo)
    return promo

@router.patch("/promos/{promo_id}/toggle", response_model=PromoOut)
def toggle_status_promo(promo_id: int, db: Session = Depends(get_db)):
    """FR-35: Mengaktifkan atau menonaktifkan promo."""
    promo = db.query(Promo).filter(Promo.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promo tidak ditemukan.")
    promo.is_active = not promo.is_active
    db.commit()
    db.refresh(promo)
    return promo

@router.delete("/promos/{promo_id}", status_code=status.HTTP_204_NO_CONTENT)
def hapus_promo(promo_id: int, db: Session = Depends(get_db)):
    """FR-35: Menghapus promo."""
    promo = db.query(Promo).filter(Promo.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promo tidak ditemukan.")
    db.delete(promo)
    db.commit()
    return None


# ================= 5. LAPORAN PENJUALAN & EKSPOR (FR-36..39, BR-13) =================
@router.get("/reports/summary", response_model=SalesReportSummary)
def get_laporan_penjualan(
    period: str = Query("harian", pattern="^(harian|mingguan|bulanan)$"),
    db: Session = Depends(get_db)
):
    """
    FR-36, FR-37, FR-38.
    BR-13: Laporan penjualan dan pendapatan HANYA mengkalkulasi pesanan
    yang status akhirnya 'Selesai'.
    """
    now = datetime.utcnow()
    if period == "harian":
        start_date = now - timedelta(days=1)
    elif period == "mingguan":
        start_date = now - timedelta(days=7)
    else:  # bulanan
        start_date = now - timedelta(days=30)

    completed_orders = db.query(Order).filter(
        Order.status == OrderStatus.SELESAI,
        Order.completed_at >= start_date
    ).all()

    total_orders = len(completed_orders)
    total_revenue = sum(order.total_amount for order in completed_orders)
    avg_order_value = round(total_revenue / total_orders, 2) if total_orders > 0 else 0.0

    # Daftar menu terlaris (FR-38)
    completed_order_ids = [o.id for o in completed_orders]
    top_items = []
    if completed_order_ids:
        top_items_query = db.query(
            OrderItem.item_name,
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.subtotal).label("total_sales")
        ).filter(
            OrderItem.order_id.in_(completed_order_ids)
        ).group_by(OrderItem.item_name).order_by(func.sum(OrderItem.quantity).desc()).limit(5).all()

        top_items = [
            {
                "name": row[0],
                "item_name": row[0],
                "sold": int(row[1]),
                "total_quantity_sold": int(row[1]),
                "sales": float(row[2]),
                "total_sales_amount": float(row[2]),
            }
            for row in top_items_query
            if row[0] and row[1] is not None
        ]

    return SalesReportSummary(
        period=period,
        total_orders_completed=total_orders,
        total_revenue=total_revenue,
        average_order_value=avg_order_value,
        top_selling_items=top_items
    )


@router.get("/reports/export-csv")
def ekspor_laporan_penjualan_csv(db: Session = Depends(get_db)):
    """
    FR-39: Mengekspor laporan penjualan ke format CSV / Excel.
    Hanya menyertakan pesanan berstatus 'Selesai' (BR-13).
    """
    orders = db.query(Order).filter(Order.status == OrderStatus.SELESAI).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID Pesanan", "Nomor Order", "Pelanggan", "Tipe", "Nomor Meja",
        "Subtotal", "Diskon", "Pajak 10%", "Biaya Layanan 5%", "Total Akhir",
        "Metode Bayar", "Status", "Waktu Selesai"
    ])

    for o in orders:
        writer.writerow([
            o.id, o.order_number, o.customer_name, o.order_type, o.table_number or "-",
            o.subtotal, o.discount_amount, o.tax_amount, o.service_fee, o.total_amount,
            o.payment_method, o.status, o.completed_at or o.created_at
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=laporan_penjualan_selesai.csv"}
    )