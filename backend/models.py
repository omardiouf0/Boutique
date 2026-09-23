from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    client = "client"


class OrderStatus(str, enum.Enum):
    en_attente = "en_attente"
    confirmee = "confirmee"
    en_livraison = "en_livraison"
    livree = "livree"
    annulee = "annulee"


class PaymentMethod(str, enum.Enum):
    orange_money = "orange_money"
    wave = "wave"
    sur_place = "sur_place"


class PaymentStatus(str, enum.Enum):
    en_attente = "en_attente"
    completee = "completee"
    echouee = "echouee"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    telephone = Column(String(20), nullable=True)
    role = Column(String(10), default=UserRole.client.value)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    slug = Column(String(120), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    prix = Column(Float, nullable=False)
    prix_promo = Column(Float, nullable=True)
    stock = Column(Integer, default=0)
    image_url = Column(String(500), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total = Column(Float, nullable=False)
    statut = Column(String(20), default=OrderStatus.en_attente.value)
    nom_client = Column(String(100), nullable=True)
    telephone = Column(String(20), nullable=True)
    adresse = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantite = Column(Integer, nullable=False)
    prix_unitaire = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    methode = Column(String(20), nullable=False)
    statut = Column(String(20), default=PaymentStatus.en_attente.value)
    reference = Column(String(100), nullable=True)
    montant = Column(Float, nullable=False)
    telephone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="payment")
