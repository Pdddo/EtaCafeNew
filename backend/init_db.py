"""
Skrip Inisialisasi Database Otomatis: EtaCafe
Menghubungkan ke PostgreSQL, membuat tabel (User, Category, MenuItem, Promo, Order, OrderItem),
dan memasukkan data awal (seed data) sesuai dokumen SRS Versi 1.2 Unhas.
"""

import sys
from app.db.database import engine, Base, SessionLocal
from app.models.models import User, Category, MenuItem, Promo, Order, OrderItem
from app.core.security import get_password_hash

def init_database():
    print("=" * 60)
    print("🔄 Memulai Inisialisasi Database: EtaCafe (SRS v1.2)")
    print("=" * 60)

    try:
        # 1. Buat semua tabel di PostgreSQL
        print("1. Membuat tabel di PostgreSQL...")
        Base.metadata.create_all(bind=engine)
        print("   ✅ Tabel berhasil dibuat:")
        print("      - users")
        print("      - categories")
        print("      - menu_items")
        print("      - promos")
        print("      - orders")
        print("      - order_items")

        db = SessionLocal()

        # 2. Cek apakah database sudah pernah diisi
        if db.query(User).first():
            print("\n⚠️ Database sudah terisi data awal (seed data). Tidak perlu inisialisasi ulang.")
            db.close()
            return

        print("\n2. Memasukkan Data Awal (Seed Data) EtaCafe...")

        # A. Kategori Menu (FR-31)
        categories_data = [
            Category(name="Kopi & Minuman", slug="kopi-minuman"),
            Category(name="Makanan Utama", slug="makanan-utama"),
            Category(name="Camilan & Snack", slug="camilan-snack"),
            Category(name="Dessert & Penutup", slug="dessert-penutup"),
        ]
        db.add_all(categories_data)
        db.commit()
        print("   ✅ 4 Kategori berhasil ditambahkan.")

        # B. Akun Pengguna 4 Role (Password default: 'rahasia123' ter-hash bcrypt)
        default_password = get_password_hash("rahasia123")
        users_data = [
            User(
                name="Kevin Somakila (Pelanggan)",
                email_or_phone="kevin@etacafe.com",
                hashed_password=default_password,
                role="pelanggan",
            ),
            User(
                name="Ahmad Kasir (Kasir EtaCafe)",
                email_or_phone="kasir@etacafe.com",
                hashed_password=default_password,
                role="kasir",
            ),
            User(
                name="Hilmy Chef (Dapur EtaCafe)",
                email_or_phone="dapur@etacafe.com",
                hashed_password=default_password,
                role="dapur",
            ),
            User(
                name="Agung Manajer (Manajer EtaCafe)",
                email_or_phone="manajer@etacafe.com",
                hashed_password=default_password,
                role="manajer",
            ),
        ]
        db.add_all(users_data)
        db.commit()
        print("   ✅ 4 Akun pengguna (Pelanggan, Kasir, Dapur, Manajer) berhasil dibuat.")
        print("      (Password login: 'rahasia123')")

        # C. Katalog Menu Makanan & Minuman EtaCafe (FR-03, FR-27, FR-34)
        menus_data = [
            MenuItem(
                name="Eta Signature Kopi Aren",
                category_id=1,
                price=18000,
                description="Espresso double shot dipadukan susu segar creamy dan gula aren organik khas EtaCafe.",
                image_url="https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600",
                is_available=True,
            ),
            MenuItem(
                name="Vanilla Caramel Macchiato",
                category_id=1,
                price=24000,
                description="Sirup vanila lembut, steamed milk, shot espresso pekat dengan saus karamel manis.",
                image_url="https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600",
                is_available=True,
            ),
            MenuItem(
                name="Matcha Green Tea Latte",
                category_id=1,
                price=22000,
                description="Matcha Uji Jepang premium dipadukan susu hangat atau dingin menyegarkan.",
                image_url="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600",
                is_available=True,
            ),
            MenuItem(
                name="Nasi Goreng Spesial EtaCafe",
                category_id=2,
                price=28000,
                description="Nasi goreng harum rempah nusantara dengan suwiran ayam, bakso, telur mata sapi, acar, dan kerupuk.",
                image_url="https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600",
                is_available=True,
            ),
            MenuItem(
                name="Ayam Geprek Sambal Korek",
                category_id=2,
                price=25000,
                description="Ayam krispi gurih digeprek sambal korek pedas segar dengan nasi putih pulen.",
                image_url="https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600",
                is_available=True,
            ),
            MenuItem(
                name="Spaghetti Carbonara Creamy",
                category_id=2,
                price=35000,
                description="Pasta spaghetti al dente saus keju parmesan creamy, beef bacon renyah, dan taburan oregano.",
                image_url="https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600",
                is_available=True,
            ),
            MenuItem(
                name="Sop Iga Sapi Kuah Gurih",
                category_id=2,
                price=48000,
                description="Iga sapi empuk kuah rempah bening gurih bertabur daun seledri dan emping.",
                image_url="https://images.unsplash.com/photo-1547592180-85f173990554?w=600",
                is_available=False, # FR-34 & BR-07: Contoh menu habis / tidak tersedia
            ),
            MenuItem(
                name="Tahu Lada Garam Crispy",
                category_id=3,
                price=16000,
                description="Tahu sutra dipotong dadu digoreng garing dengan tumisan bawang putih dan irisan cabe rawit.",
                image_url="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
                is_available=True,
            ),
            MenuItem(
                name="French Fries Truffle Herb",
                category_id=3,
                price=20000,
                description="Kentang goreng renyah bumbu truffle aromatik dan taburan keju parmesan.",
                image_url="https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600",
                is_available=True,
            ),
            MenuItem(
                name="Croffle Choco Almond",
                category_id=4,
                price=22000,
                description="Croissant waffle renyah berlapis saus dark cokelat Belgia dan kacang almond panggang.",
                image_url="https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600",
                is_available=True,
            ),
        ]
        db.add_all(menus_data)
        db.commit()
        print("   ✅ 10 Item Menu EtaCafe berhasil dimasukkan.")

        # D. Kupon Promo (FR-35)
        promos_data = [
            Promo(
                code="ETASPESIAL10",
                description="Diskon 10% untuk pesanan minimal Rp 40.000",
                discount_type="percentage",
                discount_value=10.0,
                min_order=40000.0,
                is_active=True,
            ),
            Promo(
                code="HEMAT15K",
                description="Potongan langsung Rp 15.000 untuk pesanan minimal Rp 60.000",
                discount_type="fixed",
                discount_value=15000.0,
                min_order=60000.0,
                is_active=True,
            ),
        ]
        db.add_all(promos_data)
        db.commit()
        print("   ✅ Kupon Promo berhasil ditambahkan.")

        db.close()
        print("\n🎉 Inisialisasi Database EtaCafe Selesai dengan Sukses!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Terjadi kesalahan saat inisialisasi: {e}")
        print("💡 Petunjuk: Pastikan PostgreSQL sedang berjalan dan URL koneksi di .env sudah benar.")
        sys.exit(1)

if __name__ == "__main__":
    init_database()