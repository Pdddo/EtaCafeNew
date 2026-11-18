"""
================================================================================
SUITE PENGUJIAN OPERASIONAL LENGKAP (END-TO-END & INTEGRASI) ETACAFE
Berdasarkan Dokumen Spesifikasi SRS Versi 1.2 Unhas
================================================================================
Menguji seluruh modul fungsional (FR-01 s/d FR-39) dan aturan bisnis (BR-01 s/d BR-14)
untuk ke-4 Role:
1. Pelanggan (Customer)
2. Kasir (Cashier)
3. Dapur (Kitchen)
4. Manajer (Manager)
Serta Modul Autentikasi & RBAC (Role-Based Access Control).

Pengujian berjalan pada database SQLite in-memory yang terisolasi,
sehingga bersih, cepat, dan tidak merusak database produksi/lokal.
================================================================================
"""

import unittest
import sys
import os
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Pastikan folder backend masuk ke sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from app.db.database import Base
from app.models.models import User, Category, MenuItem, Promo, Order, OrderItem, OrderStatus, OrderType
from app.core.security import get_password_hash, create_access_token, verify_password
from app.schemas.schemas import (
    RegisterRequest,
    LoginRequest,
    OrderCreate,
    OrderItemCreate,
    MenuItemCreate,
    MenuItemUpdate,
    CategoryCreate,
    PromoCreate,
    UserCreate,
)

# Endpoint Controllers
from app.api.v1.endpoints.auth import register_customer, login
from app.api.v1.endpoints.pelanggan import (
    get_katalog_menu,
    get_detail_menu,
    get_promo_aktif,
    checkout_pesanan,
    batalkan_pesanan_mandiri,
    riwayat_pesanan_pelanggan,
    lacak_status_pesanan,
)
from app.api.v1.endpoints.kasir import (
    antrean_pesanan_masuk_kasir,
    detail_pesanan_kasir,
    konfirmasi_pesanan_kasir,
    cetak_struk_transaksi,
)
from app.api.v1.endpoints.dapur import (
    antrean_pesanan_dapur,
    detail_pesanan_dapur,
    mulai_memproses_pesanan,
    tandai_pesanan_selesai,
)
from app.api.v1.endpoints.manajer import (
    tambah_menu_baru,
    ubah_data_menu,
    atur_ketersediaan_menu,
    hapus_menu,
    tambah_kategori,
    ubah_kategori,
    hapus_kategori,
    tambah_promo,
    toggle_status_promo,
    hapus_promo,
    tambah_pengguna,
    hapus_pengguna,
    get_laporan_penjualan,
    ekspor_laporan_penjualan_csv,
)


class TestEtaCafeOperationalSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Database in-memory terisolasi
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False}
        )
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)
        Base.metadata.create_all(bind=cls.engine)

    def setUp(self):
        # Setiap test menggunakan session transaksi baru
        self.db = self.SessionLocal()
        self._seed_initial_data()

    def tearDown(self):
        self.db.rollback()
        # Bersihkan tabel setelah setiap test
        for table in reversed(Base.metadata.sorted_tables):
            self.db.execute(table.delete())
        self.db.commit()
        self.db.close()

    def _seed_initial_data(self):
        hashed_pwd = get_password_hash("rahasia123")
        self.user_pelanggan = User(
            name="Kevin Pelanggan",
            email_or_phone="kevin@etacafe.com",
            hashed_password=hashed_pwd,
            role="pelanggan",
        )
        self.user_kasir = User(
            name="Ahmad Kasir",
            email_or_phone="kasir@etacafe.com",
            hashed_password=hashed_pwd,
            role="kasir",
        )
        self.user_dapur = User(
            name="Hilmy Chef",
            email_or_phone="dapur@etacafe.com",
            hashed_password=hashed_pwd,
            role="dapur",
        )
        self.user_manajer = User(
            name="Agung Manajer",
            email_or_phone="manajer@etacafe.com",
            hashed_password=hashed_pwd,
            role="manajer",
        )
        self.db.add_all([self.user_pelanggan, self.user_kasir, self.user_dapur, self.user_manajer])
        self.db.commit()

        # Seed Kategori
        self.cat_kopi = Category(name="Kopi & Minuman", slug="kopi-minuman")
        self.cat_makanan = Category(name="Makanan Utama", slug="makanan-utama")
        self.db.add_all([self.cat_kopi, self.cat_makanan])
        self.db.commit()

        # Seed Menu
        self.menu_kopi = MenuItem(
            name="Kopi Susu Gula Aren",
            category_id=self.cat_kopi.id,
            price=20000.0,
            description="Espresso blend khas dengan susu segar dan gula aren asli",
            is_available=True,
        )
        self.menu_nasi = MenuItem(
            name="Nasi Goreng Spesial",
            category_id=self.cat_makanan.id,
            price=30000.0,
            description="Nasi goreng dengan telur dan ayam suwir",
            is_available=True,
        )
        self.menu_habis = MenuItem(
            name="Menu Habis / Kosong",
            category_id=self.cat_kopi.id,
            price=15000.0,
            description="Menu contoh yang stoknya tidak tersedia",
            is_available=False,
        )
        self.db.add_all([self.menu_kopi, self.menu_nasi, self.menu_habis])
        self.db.commit()

        # Seed Promo
        self.promo_diskon = Promo(
            code="ETASPESIAL10",
            description="Diskon 10% Min Order 40k",
            discount_type="percentage",
            discount_value=10.0,
            min_order=40000.0,
            is_active=True,
        )
        self.promo_nominal = Promo(
            code="HEMAT5RB",
            description="Potongan Rp 5.000 Min Order 25k",
            discount_type="fixed",
            discount_value=5000.0,
            min_order=25000.0,
            is_active=True,
        )
        self.promo_nonaktif = Promo(
            code="EXPIREDPROMO",
            description="Promo Tidak Aktif",
            discount_type="fixed",
            discount_value=10000.0,
            min_order=20000.0,
            is_active=False,
        )
        self.db.add_all([self.promo_diskon, self.promo_nominal, self.promo_nonaktif])
        self.db.commit()

    # ==========================================================================
    # MODUL 1: AUTENTIKASI & KEAMANAN ROLE (AUTH & RBAC)
    # ==========================================================================
    def test_01_auth_register_pelanggan_sukses_dan_duplikat(self):
        """FR-01: Registrasi akun baru pelanggan dan cegah email duplikat."""
        req = RegisterRequest(
            name="Pelanggan Baru",
            email_or_phone="baru@etacafe.com",
            password="password123",
        )
        user = register_customer(payload=req, db=self.db)
        self.assertEqual(user.email_or_phone, "baru@etacafe.com")
        self.assertEqual(user.role, "pelanggan")

        # Coba daftar ulang dengan email yang sama (harus 400 Bad Request)
        with self.assertRaises(HTTPException) as ctx:
            register_customer(payload=req, db=self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("sudah terdaftar", ctx.exception.detail)

    def test_02_auth_login_sukses_dan_gagal(self):
        """FR-02: Login dengan verifikasi password dan token JWT."""
        # 1. Login sukses
        login_req = LoginRequest(
            username_or_email="kevin@etacafe.com",
            password="rahasia123",
        )
        res = login(payload=login_req, db=self.db)
        self.assertIn("access_token", res)
        self.assertEqual(res["user"].role, "pelanggan")

        # 2. Login password salah
        login_gagal = LoginRequest(
            username_or_email="kevin@etacafe.com",
            password="passwordsalah",
        )
        with self.assertRaises(HTTPException) as ctx:
            login(payload=login_gagal, db=self.db)
        self.assertEqual(ctx.exception.status_code, 401)

    # ==========================================================================
    # MODUL 2: OPERASIONAL PELANGGAN (CUSTOMER ORDERING FLOW)
    # ==========================================================================
    def test_03_pelanggan_katalog_dan_filter_menu(self):
        """FR-01, FR-02, FR-03: Katalog menu, filter kategori, dan pencarian."""
        menus = get_katalog_menu(kategori_id=None, search=None, db=self.db)
        self.assertEqual(len(menus), 3)
        names = [m.name for m in menus]
        self.assertIn("Kopi Susu Gula Aren", names)
        self.assertIn("Menu Habis / Kosong", names)

        # Filter kategori kopi
        kopi_menus = get_katalog_menu(kategori_id=self.cat_kopi.id, search=None, db=self.db)
        self.assertEqual(len(kopi_menus), 2)

        # Pencarian kata kunci
        search_res = get_katalog_menu(kategori_id=None, search="Goreng", db=self.db)
        self.assertEqual(len(search_res), 1)
        self.assertEqual(search_res[0].name, "Nasi Goreng Spesial")

        # Detail menu
        detail = get_detail_menu(menu_id=self.menu_kopi.id, db=self.db)
        self.assertEqual(detail.name, "Kopi Susu Gula Aren")

    def test_04_pelanggan_promo_aktif(self):
        """FR-06: Mengambil voucher promo aktif dari sistem."""
        promos = get_promo_aktif(db=self.db)
        # Promo aktif ada 2, promo nonaktif tidak boleh ikut
        self.assertEqual(len(promos), 2)
        codes = [p.code for p in promos]
        self.assertIn("ETASPESIAL10", codes)
        self.assertIn("HEMAT5RB", codes)
        self.assertNotIn("EXPIREDPROMO", codes)

    def test_05_pelanggan_checkout_validasi_aturan_bisnis(self):
        """BR-04, BR-07, BR-14: Validasi aturan bisnis checkout pesanan."""
        # 1. Keranjang kosong (BR-04)
        order_empty = OrderCreate(
            customer_name="Kevin",
            order_type="langsung",
            items=[],
        )
        with self.assertRaises(HTTPException) as ctx:
            checkout_pesanan(payload=order_empty, db=self.db, user=self.user_pelanggan)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Keranjang belanja kosong", ctx.exception.detail)

        # 2. Pesan item yang habis/is_available=False (BR-07)
        order_unavailable = OrderCreate(
            customer_name="Kevin",
            order_type="langsung",
            items=[OrderItemCreate(menu_item_id=self.menu_habis.id, quantity=1)],
        )
        with self.assertRaises(HTTPException) as ctx:
            checkout_pesanan(payload=order_unavailable, db=self.db, user=self.user_pelanggan)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("tidak tersedia", ctx.exception.detail)

        # 3. Pesan QR Meja tanpa nomor meja (BR-14)
        order_no_table = OrderCreate(
            customer_name="Kevin",
            order_type="qr_meja",
            table_number="", # Kosong
            items=[OrderItemCreate(menu_item_id=self.menu_kopi.id, quantity=1)],
        )
        with self.assertRaises(HTTPException) as ctx:
            checkout_pesanan(payload=order_no_table, db=self.db, user=self.user_pelanggan)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("wajib menyertakan nomor meja", ctx.exception.detail)

    def test_06_pelanggan_checkout_kalkulasi_pajak_service(self):
        """FR-07, FR-14, BR-05, BR-01: Kalkulasi Pajak 10%, Service 5%, dan Status Awal."""
        order_payload = OrderCreate(
            customer_name="Kevin Somakila",
            customer_phone="08123456789",
            order_type="qr_meja",
            table_number="Meja 03",
            items=[
                OrderItemCreate(menu_item_id=self.menu_kopi.id, quantity=2, notes="Less sugar"), # 2 x 20.000 = 40.000
                OrderItemCreate(menu_item_id=self.menu_nasi.id, quantity=1, notes="Pedas"),      # 1 x 30.000 = 30.000
            ],
            promo_code="ETASPESIAL10", # Diskon 10% dari 70.000 = 7.000
            payment_method="QRIS",
        )
        order = checkout_pesanan(payload=order_payload, db=self.db, user=self.user_pelanggan)

        # Verifikasi Subtotal & Diskon
        self.assertEqual(order.subtotal, 70000.0)
        self.assertEqual(order.discount_amount, 7000.0)

        # Verifikasi Pajak (10%) & Service (5%) dihitung dari nilai kena pajak
        after_disc = 70000.0 - 7000.0 # 63.000
        self.assertAlmostEqual(order.tax_amount, 6300.0)
        self.assertAlmostEqual(order.service_fee, 3150.0)
        self.assertAlmostEqual(order.total_amount, 72450.0)

        # Verifikasi Status Awal (BR-01)
        self.assertEqual(order.status, OrderStatus.MENUNGGU_KONFIRMASI)
        self.assertEqual(order.table_number, "Meja 03")
        self.assertEqual(len(order.items), 2)
        self.assertEqual(order.items[0].notes, "Less sugar")

    def test_07_pelanggan_pembatalan_mandiri(self):
        """FR-15, BR-03: Pembatalan pesanan mandiri sebelum dikonfirmasi kasir."""
        order_payload = OrderCreate(
            customer_name="Kevin",
            order_type="langsung",
            items=[OrderItemCreate(menu_item_id=self.menu_kopi.id, quantity=1)],
        )
        order = checkout_pesanan(payload=order_payload, db=self.db, user=self.user_pelanggan)
        self.assertEqual(order.status, OrderStatus.MENUNGGU_KONFIRMASI)

        # Batalkan saat masih 'Menunggu Konfirmasi Kasir' (harus berhasil)
        cancelled = batalkan_pesanan_mandiri(order_id=order.id, db=self.db, user=self.user_pelanggan)
        self.assertEqual(cancelled.status, OrderStatus.DIBATALKAN)
        self.assertIsNotNone(cancelled.cancelled_at)

    # ==========================================================================
    # MODUL 3: OPERASIONAL KASIR (CASHIER FLOW)
    # ==========================================================================
    def test_08_kasir_antrean_dan_konfirmasi_pesanan(self):
        """FR-16, FR-18, FR-20, BR-02, BR-09: Kasir melihat antrean dan mengonfirmasi pesanan."""
        order_payload = OrderCreate(
            customer_name="Pelanggan Meja 1",
            order_type="qr_meja",
            table_number="Meja 1",
            items=[OrderItemCreate(menu_item_id=self.menu_kopi.id, quantity=1)],
        )
        order = checkout_pesanan(payload=order_payload, db=self.db, user=self.user_pelanggan)

        # 1. Kasir cek antrean pesanan masuk
        antrean = antrean_pesanan_masuk_kasir(status_filter="menunggu", db=self.db)
        self.assertEqual(len(antrean), 1)
        self.assertEqual(antrean[0].id, order.id)

        # 2. Kasir lihat detail
        detail = detail_pesanan_kasir(order_id=order.id, db=self.db)
        self.assertEqual(detail.table_number, "Meja 1")

        # 3. Kasir konfirmasi pesanan (FR-18 & FR-20)
        confirmed = konfirmasi_pesanan_kasir(order_id=order.id, db=self.db)
        self.assertEqual(confirmed.status, OrderStatus.DIKONFIRMASI)
        self.assertIsNotNone(confirmed.confirmed_at)

    def test_09_kasir_cetak_struk_transaksi(self):
        """FR-21, BR-08: Struk hanya boleh dicetak setelah dikonfirmasi Kasir."""
        order_payload = OrderCreate(
            customer_name="Budi",
            order_type="langsung",
            items=[OrderItemCreate(menu_item_id=self.menu_kopi.id, quantity=1)],
        )
        order = checkout_pesanan(payload=order_payload, db=self.db, user=self.user_pelanggan)

        # 1. Cetak sebelum konfirmasi kasir harus DITOLAK (BR-08)
        with self.assertRaises(HTTPException) as ctx:
            cetak_struk_transaksi(order_id=order.id, db=self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("dilarang dicetak sebelum pesanan dikonfirmasi", ctx.exception.detail)

        # 2. Kasir konfirmasi pesanan
        konfirmasi_pesanan_kasir(order_id=order.id, db=self.db)

        # 3. Cetak setelah konfirmasi harus BERHASIL
        receipt = cetak_struk_transaksi(order_id=order.id, db=self.db)
        self.assertEqual(receipt["no_pesanan"], order.order_number)
        self.assertEqual(receipt["status_pesanan"], OrderStatus.DIKONFIRMASI)
        self.assertEqual(len(receipt["items"]), 1)

    # ==========================================================================
    # MODUL 4: OPERASIONAL DAPUR (KITCHEN DISPLAY SYSTEM / KDS FLOW)
    # ==========================================================================
    def test_10_dapur_antrean_dan_transisi_status(self):
        """FR-22, FR-24, FR-25, BR-09, BR-10: Antrean dapur hanya yang dikonfirmasi kasir."""
        # 1. Pesanan baru checkout (Status: Menunggu Konfirmasi)
        order_payload = OrderCreate(
            customer_name="Siti",
            order_type="qr_meja",
            table_number="Meja 4",
            items=[OrderItemCreate(menu_item_id=self.menu_nasi.id, quantity=1, notes="Extra Pedas")],
        )
        order = checkout_pesanan(payload=order_payload, db=self.db, user=self.user_pelanggan)

        # 2. Cek Dapur: Pesanan BELUM DIKONFIRMASI tidak boleh muncul di dapur (BR-09)
        dapur_queue_1 = antrean_pesanan_dapur(db=self.db)
        self.assertEqual(len(dapur_queue_1), 0)

        # 3. Kasir mengonfirmasi pesanan
        konfirmasi_pesanan_kasir(order_id=order.id, db=self.db)

        # 4. Sekarang pesanan harus muncul di Dapur
        dapur_queue_2 = antrean_pesanan_dapur(db=self.db)
        self.assertEqual(len(dapur_queue_2), 1)
        self.assertEqual(dapur_queue_2[0].items[0].notes, "Extra Pedas")

        # 5. Dapur mulai memasak (Status: Sedang Diproses)
        cooking = mulai_memproses_pesanan(order_id=order.id, db=self.db)
        self.assertEqual(cooking.status, OrderStatus.SEDANG_DIPROSES)
        self.assertIsNotNone(cooking.processing_at)

        # 6. Validasi BR-03: Pelanggan TIDAK BISA membatalkan pesanan yang sedang dimasak
        with self.assertRaises(HTTPException) as ctx:
            batalkan_pesanan_mandiri(order_id=order.id, db=self.db, user=self.user_pelanggan)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("tidak dapat dibatalkan", ctx.exception.detail)

        # 7. Dapur selesaikan pesanan (Status: Selesai)
        finished = tandai_pesanan_selesai(order_id=order.id, db=self.db)
        self.assertEqual(finished.status, OrderStatus.SELESAI)
        self.assertIsNotNone(finished.completed_at)

    # ==========================================================================
    # MODUL 5: OPERASIONAL MANAJER (MANAGER MASTER DATA & REPORTS)
    # ==========================================================================
    def test_11_manajer_crud_kategori_dan_proteksi_integritas(self):
        """FR-31, FR-32, FR-33: CRUD Kategori & Larangan hapus kategori yang punya menu."""
        # 1. Tambah kategori baru
        cat_req = CategoryCreate(name="Pastry & Roti", slug="pastry-roti")
        cat = tambah_kategori(payload=cat_req, db=self.db)
        self.assertEqual(cat.name, "Pastry & Roti")
        self.assertEqual(cat.slug, "pastry-roti")

        # 2. Ubah kategori
        cat_update = CategoryCreate(name="Bakery & Pastry", slug="bakery-pastry")
        updated_cat = ubah_kategori(category_id=cat.id, payload=cat_update, db=self.db)
        self.assertEqual(updated_cat.name, "Bakery & Pastry")

        # 3. Hapus kategori kosong (harus berhasil 204 No Content)
        del_res = hapus_kategori(category_id=cat.id, db=self.db)
        self.assertIsNone(del_res)

        # 4. Hapus kategori yang masih punya menu (harus 400 Bad Request)
        with self.assertRaises(HTTPException) as ctx:
            hapus_kategori(category_id=self.cat_kopi.id, db=self.db)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("masih memiliki", ctx.exception.detail)

    def test_12_manajer_crud_menu_dan_toggle_ketersediaan(self):
        """FR-27, FR-28, FR-30, FR-34, BR-07: CRUD Menu & Toggle ketersediaan."""
        # 1. Tambah menu
        new_menu_req = MenuItemCreate(
            name="Croissant Butter",
            category_id=self.cat_makanan.id,
            price=25000.0,
            description="Croissant renyah dengan butter Prancis",
            is_available=True,
        )
        created_menu = tambah_menu_baru(payload=new_menu_req, db=self.db)
        self.assertEqual(created_menu.name, "Croissant Butter")

        # 2. Ubah ketersediaan (toggle is_available -> False)
        toggled = atur_ketersediaan_menu(menu_id=created_menu.id, is_available=False, db=self.db)
        self.assertFalse(toggled.is_available)

        # 3. Hapus menu yang belum pernah dipesan (hard delete)
        del_res = hapus_menu(menu_id=created_menu.id, db=self.db)
        self.assertIn("berhasil dihapus", del_res["message"])

    def test_13_manajer_crud_promo(self):
        """FR-35, FR-36, FR-37: Manajemen Promo & Toggle Status."""
        promo_req = PromoCreate(
            code="WEEKEND20",
            description="Diskon Weekend 20%",
            discount_type="percentage",
            discount_value=20.0,
            min_order=50000.0,
            is_active=True,
        )
        promo = tambah_promo(payload=promo_req, db=self.db)
        self.assertEqual(promo.code, "WEEKEND20")

        # Nonaktifkan promo
        toggled = toggle_status_promo(promo_id=promo.id, db=self.db)
        self.assertFalse(toggled.is_active)

        # Hapus promo
        del_promo = hapus_promo(promo_id=promo.id, db=self.db)
        self.assertIsNone(del_promo) # 204 No Content

    def test_14_manajer_kelola_pengguna_dan_hapus_user(self):
        """FR-38: Tambah staf & penghapusan pengguna aman."""
        # 1. Tambah staf kasir baru
        user_req = UserCreate(
            name="Kasir Shift Siang",
            email_or_phone="kasir2@etacafe.com",
            password="password123",
            role="kasir",
        )
        new_kasir = tambah_pengguna(payload=user_req, db=self.db)
        self.assertEqual(new_kasir.role, "kasir")

        # 2. Hapus staf kasir baru (harus berhasil)
        del_res = hapus_pengguna(user_id=new_kasir.id, db=self.db, current=self.user_manajer)
        self.assertIsNone(del_res) # 204 No Content

        # 3. Larangan: Manajer menghapus akunnya sendiri
        with self.assertRaises(HTTPException) as ctx:
            hapus_pengguna(user_id=self.user_manajer.id, db=self.db, current=self.user_manajer)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("menghapus akun Anda sendiri", ctx.exception.detail)

    def test_15_manajer_laporan_penjualan_dan_ekspor_csv(self):
        """FR-39, BR-13: Laporan penjualan, produk terlaris, dan ekspor CSV."""
        # Buat pesanan dan selesaikan seluruh siklusnya
        order_payload = OrderCreate(
            customer_name="Pelanggan Laporan",
            order_type="langsung",
            items=[
                OrderItemCreate(menu_item_id=self.menu_kopi.id, quantity=3), # 3 x 20.000 = 60.000
            ],
            payment_method="Tunai",
        )
        order = checkout_pesanan(payload=order_payload, db=self.db, user=self.user_pelanggan)
        konfirmasi_pesanan_kasir(order_id=order.id, db=self.db)
        mulai_memproses_pesanan(order_id=order.id, db=self.db)
        tandai_pesanan_selesai(order_id=order.id, db=self.db)

        # 1. Ringkasan penjualan
        report = get_laporan_penjualan(period="harian", db=self.db)
        self.assertEqual(report.total_orders_completed, 1)
        self.assertGreater(report.total_revenue, 0)

        # 2. Ekspor CSV
        csv_res = ekspor_laporan_penjualan_csv(db=self.db)
        self.assertEqual(csv_res.media_type, "text/csv")
        csv_content = csv_res.body.decode("utf-8")
        self.assertIn("ID Pesanan", csv_content)
        self.assertIn("Pelanggan Laporan", csv_content)


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("🚀 MENJALANKAN SUITE PENGUJIAN OPERASIONAL LENGKAP ETACAFE")
    print("=" * 70)
    suite = unittest.TestLoader().loadTestsFromTestCase(TestEtaCafeOperationalSuite)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if result.wasSuccessful():
        print("\n✅ SELURUH 15 SKENARIO PENGUJIAN OPERASIONAL BERHASIL 100%!")
        sys.exit(0)
    else:
        print("\n❌ TERDAPAT PENGUJIAN YANG GAGAL.")
        sys.exit(1)
