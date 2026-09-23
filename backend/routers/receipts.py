from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from auth import ALGORITHM, SECRET_KEY
from database import get_db
from models import Order, Payment, User

router = APIRouter(prefix="/api/receipts", tags=["Reçus"])


@router.get("/{order_id}", response_class=HTMLResponse)
def get_receipt(
    order_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    if user.role != "admin" and order.user_id != user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    payment = db.query(Payment).filter(Payment.order_id == order.id).first()

    items_html = ""
    for item in order.items:
        product_name = item.product.nom if item.product else f"Produit #{item.product_id}"
        total_item = item.prix_unitaire * item.quantite
        items_html += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">{product_name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">{item.quantite}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">{item.prix_unitaire:,.0f} FCFA</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">{total_item:,.0f} FCFA</td>
        </tr>
        """

    payment_info = ""
    if payment:
        payment_info = f"""
        <div style="margin-top: 15px; padding: 12px; background: #FFF5EB; border-radius: 8px; font-size: 14px;">
            <strong>Mode de paiement :</strong> {payment.methode.value.upper()}<br>
            <strong>Référence :</strong> {payment.reference or 'N/A'}<br>
            <strong>Statut :</strong> {payment.statut.value}
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Reçu - Commande #{order.id}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; margin: 0; padding: 30px 15px; color: #1a1a2e; }}
        .card {{ max-width: 650px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 40px; }}
        .header {{ text-align: center; border-bottom: 2px solid #F68B1E; padding-bottom: 20px; margin-bottom: 25px; }}
        .logo {{ font-size: 28px; font-weight: 800; color: #F68B1E; margin: 0; }}
        .tagline {{ color: #6b7280; font-size: 14px; margin-top: 4px; }}
        .info-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; font-size: 14px; }}
        table {{ width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px; }}
        th {{ background: #F68B1E; color: white; padding: 10px; text-align: left; }}
        .total-box {{ text-align: right; margin-top: 15px; font-size: 18px; font-weight: bold; color: #F68B1E; }}
        .print-btn {{ display: block; margin: 0 auto 20px; background: #F68B1E; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; }}
        @media print {{ .print-btn {{ display: none; }} body {{ background: white; padding: 0; }} .card {{ box-shadow: none; padding: 20px; }} }}
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">🖨️ Imprimer le reçu</button>
    <div class="card">
        <div class="header">
            <h1 class="logo">🛒 BazarShop</h1>
            <div class="tagline">Votre boutique en ligne de confiance</div>
        </div>
        <div class="info-grid">
            <div>
                <p><strong>Commande :</strong> #{order.id}</p>
                <p><strong>Date :</strong> {order.created_at.strftime('%d/%m/%Y %H:%M')}</p>
                <p><strong>Statut :</strong> {order.statut.value}</p>
            </div>
            <div>
                <p><strong>Client :</strong> {order.nom_client or user.nom}</p>
                <p><strong>Téléphone :</strong> {order.telephone or user.telephone or 'N/A'}</p>
                <p><strong>Adresse :</strong> {order.adresse or 'N/A'}</p>
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Produit</th>
                    <th style="text-align: center;">Qté</th>
                    <th style="text-align: right;">Prix Unit.</th>
                    <th style="text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                {items_html}
            </tbody>
        </table>
        <div class="total-box">
            TOTAL : {order.total:,.0f} FCFA
        </div>
        {payment_info}
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af; border-top: 1px solid #eee; padding-top: 15px;">
            Merci pour votre achat ! 🙏<br>
            BazarShop — contact@bazarshop.com
        </div>
    </div>
</body>
</html>
"""
    return HTMLResponse(content=html)
