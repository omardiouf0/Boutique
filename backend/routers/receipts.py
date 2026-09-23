from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from jose import JWTError, jwt
import io

from database import get_db
from models import Order, OrderItem, Payment, User
from auth import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/api/receipts", tags=["Receipts"])


@router.get("/{order_id}")
def generate_receipt(
    order_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    # Authenticate via query token (since browser opens in new tab)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalide")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")

    order = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.payment)
    ).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    if user.role != "admin" and order.user_id != user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('CustomTitle', parent=styles['Title'], fontSize=22, textColor=colors.HexColor('#F68B1E'))
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=10, textColor=colors.grey, alignment=TA_CENTER)
    heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#333333'))
    normal_style = styles['Normal']
    right_style = ParagraphStyle('Right', parent=styles['Normal'], alignment=TA_RIGHT, fontSize=12)
    bold_right = ParagraphStyle('BoldRight', parent=right_style, fontName='Helvetica-Bold', fontSize=14, textColor=colors.HexColor('#F68B1E'))

    elements = []

    # Header
    elements.append(Paragraph("🛒 BazarShop", title_style))
    elements.append(Paragraph("Votre boutique en ligne de confiance", subtitle_style))
    elements.append(Spacer(1, 10*mm))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#F68B1E')))
    elements.append(Spacer(1, 5*mm))

    # Order info
    elements.append(Paragraph(f"REÇU DE COMMANDE #{order.id}", heading_style))
    elements.append(Spacer(1, 3*mm))
    elements.append(Paragraph(f"<b>Date :</b> {order.created_at.strftime('%d/%m/%Y à %H:%M')}", normal_style))
    elements.append(Paragraph(f"<b>Client :</b> {order.nom_client or 'N/A'}", normal_style))
    elements.append(Paragraph(f"<b>Téléphone :</b> {order.telephone or 'N/A'}", normal_style))
    elements.append(Paragraph(f"<b>Adresse :</b> {order.adresse or 'N/A'}", normal_style))
    elements.append(Spacer(1, 5*mm))

    # Items table
    table_data = [['Produit', 'Qté', 'Prix Unit.', 'Total']]
    for item in order.items:
        product_name = item.product.nom if item.product else f"Produit #{item.product_id}"
        table_data.append([
            product_name,
            str(item.quantite),
            f"{item.prix_unitaire:,.0f} FCFA",
            f"{item.prix_unitaire * item.quantite:,.0f} FCFA"
        ])

    table = Table(table_data, colWidths=[220, 50, 110, 110])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F68B1E')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FFF5EB')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFF5EB'), colors.white]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E0E0E0')),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 5*mm))

    # Total
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E0E0E0')))
    elements.append(Spacer(1, 3*mm))
    elements.append(Paragraph(f"TOTAL : {order.total:,.0f} FCFA", bold_right))
    elements.append(Spacer(1, 5*mm))

    # Payment info
    if order.payment:
        methode_labels = {
            'orange_money': '🟠 Orange Money',
            'wave': '🔵 Wave',
            'sur_place': '📍 Sur Place'
        }
        statut_labels = {
            'completee': '✅ Complété',
            'en_attente': '⏳ En attente',
            'echouee': '❌ Échoué'
        }
        elements.append(Paragraph("PAIEMENT", heading_style))
        elements.append(Paragraph(f"<b>Méthode :</b> {methode_labels.get(order.payment.methode, order.payment.methode)}", normal_style))
        elements.append(Paragraph(f"<b>Référence :</b> {order.payment.reference}", normal_style))
        elements.append(Paragraph(f"<b>Statut :</b> {statut_labels.get(order.payment.statut, order.payment.statut)}", normal_style))
        if order.payment.telephone:
            elements.append(Paragraph(f"<b>Téléphone :</b> {order.payment.telephone}", normal_style))

    elements.append(Spacer(1, 10*mm))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E0E0E0')))
    elements.append(Spacer(1, 3*mm))
    elements.append(Paragraph("Merci pour votre achat ! 🙏", ParagraphStyle('Footer', parent=normal_style, alignment=TA_CENTER, textColor=colors.grey)))
    elements.append(Paragraph("BazarShop — contact@bazarshop.com", ParagraphStyle('FooterSm', parent=normal_style, alignment=TA_CENTER, fontSize=8, textColor=colors.grey)))

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=recu_commande_{order.id}.pdf"}
    )
