from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from database import get_db
from models import Payment, Order, PaymentMethod, PaymentStatus, OrderStatus, User
from schemas import PaymentCreate, PaymentOut
from auth import get_current_user

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.post("/", response_model=PaymentOut)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    if user.role != "admin" and order.user_id != user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    existing_payment = db.query(Payment).filter(Payment.order_id == data.order_id).first()
    if existing_payment:
        raise HTTPException(status_code=400, detail="Un paiement existe déjà pour cette commande")

    valid_methods = [m.value for m in PaymentMethod]
    if data.methode not in valid_methods:
        raise HTTPException(status_code=400, detail=f"Méthode invalide. Valeurs: {valid_methods}")

    reference = f"BZS-{uuid.uuid4().hex[:8].upper()}"

    # Simulate payment processing
    if data.methode == PaymentMethod.orange_money.value:
        if not data.telephone:
            raise HTTPException(status_code=400, detail="Numéro de téléphone requis pour Orange Money")
        payment_status = PaymentStatus.completee.value
    elif data.methode == PaymentMethod.wave.value:
        if not data.telephone:
            raise HTTPException(status_code=400, detail="Numéro de téléphone requis pour Wave")
        payment_status = PaymentStatus.completee.value
    else:  # sur_place
        payment_status = PaymentStatus.en_attente.value

    payment = Payment(
        order_id=data.order_id,
        methode=data.methode,
        statut=payment_status,
        reference=reference,
        montant=order.total,
        telephone=data.telephone
    )

    db.add(payment)

    # Update order status based on payment
    if payment_status == PaymentStatus.completee.value:
        order.statut = OrderStatus.confirmee.value
    
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/{order_id}", response_model=PaymentOut)
def get_payment(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    payment = db.query(Payment).filter(Payment.order_id == order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Paiement non trouvé")
    return payment
