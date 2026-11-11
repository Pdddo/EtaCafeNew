from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# ================= AUTH & USER =================
class UserBase(BaseModel):
    name: str
    email_or_phone: str
    role: str = "pelanggan"

class RegisterRequest(BaseModel):
    name: str
    email_or_phone: str
    password: str = Field(..., min_length=6)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserOut(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

# ================= MENU & KATEGORI =================
class CategoryBase(BaseModel):
    name: str
    slug: str

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    class Config:
        from_attributes = True

class MenuItemBase(BaseModel):
    name: str
    category_id: int
    price: float
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_available: bool = True

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    price: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None

class MenuItemOut(MenuItemBase):
    id: int
    created_at: datetime
    category_rel: Optional[CategoryOut] = None
    class Config:
        from_attributes = True

# ================= PROMO =================
class PromoBase(BaseModel):
    code: str
    description: str
    discount_type: str # 'percentage' / 'fixed'
    discount_value: float
    min_order: float = 0.0
    is_active: bool = True

class PromoCreate(PromoBase):
    pass

class PromoOut(PromoBase):
    id: int
    class Config:
        from_attributes = True

# ================= ORDER =================
class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = Field(..., gt=0)
    notes: Optional[str] = None
    custom_notes: Optional[str] = None

    @property
    def final_notes(self) -> Optional[str]:
        return self.notes or self.custom_notes

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: Optional[str] = None
    order_type: str # 'langsung' / 'qr_meja'
    table_number: Optional[str] = None
    items: List[OrderItemCreate] # BR-04: Tidak boleh kosong
    promo_code: Optional[str] = None
    payment_method: str = "QRIS"

class OrderItemOut(BaseModel):
    id: int
    menu_item_id: int
    item_name: str
    price: float
    quantity: int
    notes: Optional[str]
    subtotal: float
    class Config:
        from_attributes = True

class OrderOut(BaseModel):
    id: int
    order_number: str
    customer_id: Optional[int] = None
    customer_name: str
    customer_phone: Optional[str] = None
    order_type: str
    table_number: Optional[str] = None
    subtotal: float
    discount_amount: float
    promo_code: Optional[str] = None
    tax_amount: float
    service_fee: float
    total_amount: float
    payment_method: str
    payment_status: str
    status: str
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    processing_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True

# ================= LAPORAN =================
class SalesReportSummary(BaseModel):
    period: str
    total_orders_completed: int
    total_revenue: float
    average_order_value: float
    top_selling_items: List[dict]
