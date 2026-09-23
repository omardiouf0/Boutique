from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth import get_current_admin, get_current_user
from database import get_db
from models import Order, OrderItem, OrderStatus, Product, User
from schemas import OrderCreate, OrderOut, OrderStatusUpdate

router = APIRouter(prefix="/api/orders", tags=["Commandes"])


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not order_data.items:
        raise HTTPException(status_code=400, detail="La commande doit contenir au moins un article")

    total = 0.0
    order_items = []

    for item in order_data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Produit {item.product_id} non trouvé")
        if product.stock < item.quantite:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuffisant pour {product.nom} (disponible: {product.stock})",
            )

        unit_price = product.prix_promo if product.prix_promo else product.prix
        total += unit_price * item.quantite

        product.stock -= item.quantite

        order_items.append(
            OrderItem(
                product_id=product.id,
                quantite=item.quantite,
                prix_unitaire=unit_price,
            )
        )

    order = Order(
        user_id=current_user.id,
        total=total,
        statut=OrderStatus.EN_ATTENTE,
        nom_client=order_data.nom_client or current_user.nom,
        telephone=order_data.telephone or current_user.telephone,
        adresse=order_data.adresse,
        items=order_items,
    )

    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("/my", response_model=List[OrderOut])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("", response_model=List[OrderOut])
def list_all_orders(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return db.query(Order).order_by(Order.created_at.desc()).all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    if current_user.role != "admin" and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    return order


@router.put("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    if status_data.statut == OrderStatus.ANNULEE and order.statut != OrderStatus.ANNULEE:
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock += item.quantite

    order.statut = status_data.statut
    db.commit()
    db.refresh(order)
    return order
