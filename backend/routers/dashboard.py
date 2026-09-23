from datetime import datetime, date
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from auth import get_current_admin
from database import get_db
from models import Order, Payment, PaymentStatus, Product, User
from schemas import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["Tableau de Bord"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    total_revenue = (
        db.query(func.coalesce(func.sum(Payment.montant), 0.0))
        .filter(Payment.statut == PaymentStatus.COMPLETEE)
        .scalar()
    )

    total_orders = db.query(func.count(Order.id)).scalar()

    total_products = db.query(func.count(Product.id)).scalar()

    low_stock = db.query(func.count(Product.id)).filter(Product.stock <= 5, Product.is_active == True).scalar()

    today = date.today()
    orders_today = (
        db.query(func.count(Order.id))
        .filter(func.date(Order.created_at) == today)
        .scalar()
    )

    recent_orders = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_products": total_products,
        "low_stock_products": low_stock,
        "orders_today": orders_today,
        "recent_orders": recent_orders,
    }
