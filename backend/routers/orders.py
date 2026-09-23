from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import get_db
from models import Order, OrderItem, Product, User, OrderStatus
from schemas import OrderCreate, OrderOut, OrderStatusUpdate
from auth import get_current_user, get_current_admin

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.post("/", response_model=OrderOut)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if not data.items:
        raise HTTPException(status_code=400, detail="La commande doit contenir au moins un article")

    total = 0.0
    order_items = []

    for item in data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Produit ID {item.product_id} non trouvé")
        if product.stock < item.quantite:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuffisant pour '{product.nom}' (disponible: {product.stock})"
            )

        prix = product.prix_promo if product.prix_promo else product.prix
        total += prix * item.quantite

        order_items.append(OrderItem(
            product_id=product.id,
            quantite=item.quantite,
            prix_unitaire=prix
        ))

        # Reduce stock
        product.stock -= item.quantite

    order = Order(
        user_id=user.id,
        total=round(total, 2),
        statut=OrderStatus.en_attente.value,
        nom_client=data.nom_client or user.nom,
        telephone=data.telephone or user.telephone,
        adresse=data.adresse
    )
    order.items = order_items

    db.add(order)
    db.commit()
    db.refresh(order)

    return db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.payment)
    ).filter(Order.id == order.id).first()


@router.get("/my", response_model=List[OrderOut])
def get_my_orders(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.payment)
    ).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()


@router.get("/", response_model=List[OrderOut])
def get_all_orders(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.payment)
    ).order_by(Order.created_at.desc()).all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    order = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.payment)
    ).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    if user.role != "admin" and order.user_id != user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    return order


@router.put("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    valid_statuses = [s.value for s in OrderStatus]
    if data.statut not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Statut invalide. Valeurs possibles: {valid_statuses}")

    # If cancelling, restore stock
    if data.statut == OrderStatus.annulee.value and order.statut != OrderStatus.annulee.value:
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock += item.quantite

    order.statut = data.statut
    db.commit()
    db.refresh(order)

    return db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.payment)
    ).filter(Order.id == order.id).first()
