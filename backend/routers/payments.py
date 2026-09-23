import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Order, OrderStatus, Payment, PaymentMethod, PaymentStatus, User
from schemas import PaymentCreate, PaymentOut
from auth import get_current_user

router = APIRouter(prefix="/api/payments", tags=["Paiements"])


@router.post("", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def process_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == payment_data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    if current_user.role != "admin" and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    existing_payment = db.query(Payment).filter(Payment.order_id == payment_data.order_id).first()
    if existing_payment:
        raise HTTPException(status_code=400, detail="Cette commande a déjà un paiement associé")

    reference = f"PAY-{uuid.uuid4().hex[:8].upper()}"

    if payment_data.methode in [PaymentMethod.ORANGE_MONEY, PaymentMethod.WAVE]:
        if not payment_data.telephone:
            raise HTTPException(
                status_code=400,
                detail=f"Numéro de téléphone requis pour le paiement par {payment_data.methode.value}",
            )
        payment_status = PaymentStatus.COMPLETEE
        order.statut = OrderStatus.CONFIRMEE
    else:
        payment_status = PaymentStatus.EN_ATTENTE

    payment = Payment(
        order_id=order.id,
        methode=payment_data.methode,
        statut=payment_status,
        reference=reference,
        montant=order.total,
        telephone=payment_data.telephone,
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/{order_id}", response_model=PaymentOut)
def get_payment(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = db.query(Payment).filter(Payment.order_id == order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Paiement non trouvé")

    order = db.query(Order).filter(Order.id == order_id).first()
    if current_user.role != "admin" and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    return payment
