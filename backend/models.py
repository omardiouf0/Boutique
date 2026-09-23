import enum
from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from database import Base


class UserRole(str, enum.Enum):
    CLIENT = "client"
    ADMIN = "admin"


class OrderStatus(str, enum.Enum):
    EN_ATTENTE = "en_attente"
    CONFIRMEE = "confirmee"
    EN_LIVRAISON = "en_livraison"
    LIVREE = "livree"
    ANNULEE = "annulee"


class PaymentMethod(str, enum.Enum):
    ORANGE_MONEY = "orange_money"
    WAVE = "wave"
    SUR_PLACE = "sur_place"


class PaymentStatus(str, enum.Enum):
    EN_ATTENTE = "en_attente"
    COMPLETEE = "completee"
    ECHOUÉE = "echouee"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    telephone = Column(String(20), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.CLIENT, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    slug = Column(String(120), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="category", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(200), index=True, nullable=False)
    description = Column(Text, nullable=True)
    prix = Column(Float, nullable=False)
    prix_promo = Column(Float, nullable=True)
    stock = Column(Integer, default=0, nullable=False)
    image_url = Column(String(500), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    total = Column(Float, nullable=False)
    statut = Column(Enum(OrderStatus), default=OrderStatus.EN_ATTENTE, nullable=False)
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
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantite = Column(Integer, nullable=False, default=1)
    prix_unitaire = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    methode = Column(Enum(PaymentMethod), nullable=False)
    statut = Column(Enum(PaymentStatus), default=PaymentStatus.EN_ATTENTE, nullable=False)
    reference = Column(String(100), unique=True, nullable=True)
    montant = Column(Float, nullable=False)
    telephone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="payment")
