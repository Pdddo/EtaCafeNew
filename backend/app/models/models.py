from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.database import Base

class UserRole(str, enum.Enum):
    PELANGGAN = "pelanggan"
    KASIR = "kasir"
    DAPUR = "dapur"
    MANAJER = "manajer"

class OrderStatus(str, enum.Enum):
    MENUNGGU_KONFIRMASI = "Menunggu Konfirmasi Kasir"
    DIKONFIRMASI = "Dikonfirmasi"
    SEDANG_DIPROSES = "Sedang Diproses"
    SELESAI = "Selesai"
    DIBATALKAN = "Dibatalkan"

class OrderType(str, enum.Enum):
    LANGSUNG = "langsung"
    QR_MEJA = "qr_meja"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email_or_phone = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.PELANGGAN, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="customer")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), unique=True, nullable=False)
    slug = Column(String(80), unique=True, nullable=False)

    menu_items = relationship("MenuItem", back_populates="category_rel", cascade="all, delete-orphan")

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    price = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    is_available = Column(Boolean, default=True, nullable=False) # FR-34 & BR-07
    created_at = Column(DateTime, default=datetime.utcnow)

    category_rel = relationship("Category", back_populates="menu_items")
    order_items = relationship("OrderItem", back_populates="menu_item")

class Promo(Base):
    __tablename__ = "promos"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=False)
    discount_type = Column(String(20), nullable=False) # 'percentage' atau 'fixed'
    discount_value = Column(Float, nullable=False)
    min_order = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True) # FR-35

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(30), nullable=True)
    order_type = Column(String(20), default=OrderType.LANGSUNG, nullable=False) # 'langsung' / 'qr_meja'
    table_number = Column(String(20), nullable=True) # BR-14: Otomatis jika qr_meja
    
    subtotal = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    promo_code = Column(String(50), nullable=True)
    tax_amount = Column(Float, default=0.0)      # 10%
    service_fee = Column(Float, default=0.0)     # 5%
    total_amount = Column(Float, nullable=False) # BR-05: (Subtotal - Diskon) + Pajak + Service
    
    payment_method = Column(String(50), nullable=False) # QRIS / Kartu / Tunai
    payment_status = Column(String(50), default="Berhasil (Simulasi)") # BR-12
    status = Column(String(50), default=OrderStatus.MENUNGGU_KONFIRMASI) # BR-01
    
    created_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)    # FR-20: Waktu konfirmasi kasir
    processing_at = Column(DateTime, nullable=True)   # FR-24: Mulai dimasak dapur
    completed_at = Column(DateTime, nullable=True)    # FR-25: Selesai disajikan
    cancelled_at = Column(DateTime, nullable=True)    # FR-15 / BR-03: Dibatalkan pelanggan

    customer = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    item_name = Column(String(150), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True) # FR-13: Catatan khusus per item
    subtotal = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem", back_populates="order_items")
