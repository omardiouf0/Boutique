from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import re

from database import get_db
from models import Category, User
from schemas import CategoryCreate, CategoryUpdate, CategoryOut
from auth import get_current_admin

router = APIRouter(prefix="/api/categories", tags=["Categories"])


def generate_slug(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s]+', '-', slug)
    return slug


@router.get("/", response_model=List[CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.nom).all()


@router.get("/{category_id}", response_model=CategoryOut)
def get_category(category_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    return cat


@router.post("/", response_model=CategoryOut)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    existing = db.query(Category).filter(Category.nom == data.nom).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cette catégorie existe déjà")

    cat = Category(
        nom=data.nom,
        description=data.description,
        image_url=data.image_url,
        slug=generate_slug(data.nom)
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")

    if data.nom is not None:
        cat.nom = data.nom
        cat.slug = generate_slug(data.nom)
    if data.description is not None:
        cat.description = data.description
    if data.image_url is not None:
        cat.image_url = data.image_url

    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")

    db.delete(cat)
    db.commit()
    return {"message": "Catégorie supprimée"}
