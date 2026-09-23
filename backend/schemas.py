from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ─── Auth ───────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    nom: str
    email: EmailStr
    password: str
    telephone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    nom: str
    email: str
    telephone: Optional[str] = None
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ─── Categories ─────────────────────────────────────────────────────
class CategoryCreate(BaseModel):
    nom: str
    description: Optional[str] = None
    image_url: Optional[str] = None


class CategoryUpdate(BaseModel):
    nom: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None


class CategoryOut(BaseModel):
    id: int
    nom: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    slug: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Products ───────────────────────────────────────────────────────
class ProductCreate(BaseModel):
    nom: str
    description: Optional[str] = None
    prix: float
    prix_promo: Optional[float] = None
    stock: int = 0
    image_url: Optional[str] = None
    category_id: int
    is_active: bool = True


class ProductUpdate(BaseModel):
    nom: Optional[str] = None
    description: Optional[str] = None
    prix: Optional[float] = None
    prix_promo: Optional[float] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    is_active: Optional[bool] = None


class ProductOut(BaseModel):
    id: int
    nom: str
    description: Optional[str] = None
    prix: float
    prix_promo: Optional[float] = None
    stock: int
    image_url: Optional[str] = None
    category_id: int
    category: Optional[CategoryOut] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class StockUpdate(BaseModel):
    stock: int


# ─── Orders ─────────────────────────────────────────────────────────
class OrderItemCreate(BaseModel):
    product_id: int
    quantite: int


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    nom_client: Optional[str] = None
    telephone: Optional[str] = None
    adresse: Optional[str] = None


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantite: int
    prix_unitaire: float
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True


class PaymentOut(BaseModel):
    id: int
    order_id: int
    methode: str
    statut: str
    reference: Optional[str] = None
    montant: float
    telephone: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    user_id: int
    total: float
    statut: str
    nom_client: Optional[str] = None
    telephone: Optional[str] = None
    adresse: Optional[str] = None
    created_at: datetime
    items: List[OrderItemOut] = []
    payment: Optional[PaymentOut] = None

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    statut: str


# ─── Payments ───────────────────────────────────────────────────────
class PaymentCreate(BaseModel):
    order_id: int
    methode: str  # orange_money, wave, sur_place
    telephone: Optional[str] = None


# ─── Dashboard ──────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_revenue: float
    total_orders: int
    total_products: int
    low_stock_products: int
    orders_today: int
    recent_orders: List[OrderOut] = []
