from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from models import OrderStatus, PaymentMethod, PaymentStatus, UserRole


# User schemas
class UserBase(BaseModel):
    nom: str
    email: EmailStr
    telephone: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: int
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# Category schemas
class CategoryBase(BaseModel):
    nom: str
    description: Optional[str] = None
    image_url: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    id: int
    slug: str
    created_at: datetime

    class Config:
        from_attributes = True


# Product schemas
class ProductBase(BaseModel):
    nom: str
    description: Optional[str] = None
    prix: float
    prix_promo: Optional[float] = None
    stock: int = 0
    image_url: Optional[str] = None
    category_id: int
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductOut(ProductBase):
    id: int
    created_at: datetime
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True


class ProductStockUpdate(BaseModel):
    stock: int


# Order schemas
class OrderItemCreate(BaseModel):
    product_id: int
    quantite: int


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantite: int
    prix_unitaire: float
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    nom_client: Optional[str] = None
    telephone: Optional[str] = None
    adresse: Optional[str] = None


class PaymentOut(BaseModel):
    id: int
    order_id: int
    methode: PaymentMethod
    statut: PaymentStatus
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
    statut: OrderStatus
    nom_client: Optional[str] = None
    telephone: Optional[str] = None
    adresse: Optional[str] = None
    created_at: datetime
    items: List[OrderItemOut] = []
    payment: Optional[PaymentOut] = None

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    statut: OrderStatus


# Payment schemas
class PaymentCreate(BaseModel):
    order_id: int
    methode: PaymentMethod
    telephone: Optional[str] = None


# Dashboard schemas
class DashboardStats(BaseModel):
    total_revenue: float
    total_orders: int
    total_products: int
    low_stock_products: int
    orders_today: int
    recent_orders: List[OrderOut]
