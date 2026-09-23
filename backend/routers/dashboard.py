from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, timedelta

from database import get_db
from models import Order, Product, Payment, OrderItem, User
from schemas import DashboardStats, OrderOut
from auth import get_current_admin

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    # Total revenue from completed payments
    total_revenue = db.query(func.sum(Payment.montant)).filter(
        Payment.statut == "completee"
    ).scalar() or 0.0

    total_orders = db.query(func.count(Order.id)).scalar() or 0
    total_products = db.query(func.count(Product.id)).scalar() or 0
    low_stock = db.query(func.count(Product.id)).filter(Product.stock <= 5, Product.is_active == True).scalar() or 0

    # Orders today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    orders_today = db.query(func.count(Order.id)).filter(Order.created_at >= today_start).scalar() or 0

    # Recent orders
    recent = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.payment)
    ).order_by(Order.created_at.desc()).limit(10).all()

    return DashboardStats(
        total_revenue=round(total_revenue, 2),
        total_orders=total_orders,
        total_products=total_products,
        low_stock_products=low_stock,
        orders_today=orders_today,
        recent_orders=recent
    )
