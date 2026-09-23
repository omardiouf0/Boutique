from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import os
import uuid
import shutil

from database import get_db
from models import Product, Category, User
from schemas import ProductCreate, ProductUpdate, ProductOut, StockUpdate
from auth import get_current_admin

router = APIRouter(prefix="/api/products", tags=["Products"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/", response_model=List[ProductOut])
def get_products(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = Query(None, regex="^(prix_asc|prix_desc|recent|nom)$"),
    limit: int = Query(50, le=100),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Product).options(joinedload(Product.category)).filter(Product.is_active == True)

    if category_id:
        query = query.filter(Product.category_id == category_id)
    if search:
        query = query.filter(Product.nom.ilike(f"%{search}%"))
    if min_price is not None:
        query = query.filter(Product.prix >= min_price)
    if max_price is not None:
        query = query.filter(Product.prix <= max_price)

    if sort == "prix_asc":
        query = query.order_by(Product.prix.asc())
    elif sort == "prix_desc":
        query = query.order_by(Product.prix.desc())
    elif sort == "nom":
        query = query.order_by(Product.nom.asc())
    else:
        query = query.order_by(Product.created_at.desc())

    return query.offset(offset).limit(limit).all()


@router.get("/all", response_model=List[ProductOut])
def get_all_products(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin: get all products including inactive ones"""
    return db.query(Product).options(joinedload(Product.category)).order_by(Product.created_at.desc()).all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).options(joinedload(Product.category)).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return product


@router.post("/", response_model=ProductOut)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    category = db.query(Category).filter(Category.id == data.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")

    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return db.query(Product).options(joinedload(Product.category)).filter(Product.id == product.id).first()


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return db.query(Product).options(joinedload(Product.category)).filter(Product.id == product.id).first()


@router.patch("/{product_id}/stock", response_model=ProductOut)
def update_stock(
    product_id: int,
    data: StockUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    product.stock = data.stock
    db.commit()
    db.refresh(product)
    return db.query(Product).options(joinedload(Product.category)).filter(Product.id == product.id).first()


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    db.delete(product)
    db.commit()
    return {"message": "Produit supprimé"}


@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": f"/uploads/{filename}"}
