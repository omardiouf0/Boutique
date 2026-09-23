from database import SessionLocal, engine, Base
from models import User, Category, Product, UserRole
from auth import get_password_hash

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()

    if db.query(User).first():
        print("La base de données contient déjà des données.")
        db.close()
        return

    # Create admin
    admin = User(
        nom="Administrateur",
        email="admin@bazarshop.com",
        password_hash=get_password_hash("admin123"),
        telephone="+221770000000",
        role=UserRole.ADMIN,
    )
    db.add(admin)

    # Create client
    client = User(
        nom="Moussa Diop",
        email="moussa@example.com",
        password_hash=get_password_hash("password123"),
        telephone="+221771234567",
        role=UserRole.CLIENT,
    )
    db.add(client)

    categories_data = [
        {"nom": "Électronique", "slug": "electronique", "description": "Smartphones, tablettes, ordinateurs et accessoires", "image_url": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400"},
        {"nom": "Mode Homme", "slug": "mode-homme", "description": "Vêtements, chaussures et accessoires pour homme", "image_url": "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=400"},
        {"nom": "Mode Femme", "slug": "mode-femme", "description": "Vêtements, chaussures et accessoires pour femme", "image_url": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400"},
        {"nom": "Maison & Cuisine", "slug": "maison-cuisine", "description": "Meubles, décoration et ustensiles de cuisine", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400"},
        {"nom": "Beauté & Santé", "slug": "beaute-sante", "description": "Cosmétiques, soins et produits de santé", "image_url": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400"},
        {"nom": "Sports & Loisirs", "slug": "sports-loisirs", "description": "Équipements sportifs et articles de loisirs", "image_url": "https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=400"},
    ]

    cat_objs = {}
    for cat in categories_data:
        c = Category(**cat)
        db.add(c)
        db.flush()
        cat_objs[cat["slug"]] = c

    products_data = [
        {"nom": "iPhone 15 Pro Max", "description": "Apple iPhone 15 Pro Max 256GB, écran Super Retina XDR 6.7 pouces", "prix": 850000, "prix_promo": 799000, "stock": 15, "category_id": cat_objs["electronique"].id, "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400"},
        {"nom": "Samsung Galaxy S24 Ultra", "description": "Samsung Galaxy S24 Ultra 256GB, S Pen", "prix": 780000, "prix_promo": 725000, "stock": 20, "category_id": cat_objs["electronique"].id, "image_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400"},
        {"nom": "MacBook Air M3", "description": "Apple MacBook Air 15 pouces avec puce M3", "prix": 950000, "prix_promo": None, "stock": 8, "category_id": cat_objs["electronique"].id, "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"},
        {"nom": "Écouteurs AirPods Pro 2", "description": "Apple AirPods Pro 2e génération avec boîtier MagSafe", "prix": 175000, "prix_promo": 155000, "stock": 30, "category_id": cat_objs["electronique"].id, "image_url": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400"},
        {"nom": "Polo Ralph Lauren Classic", "description": "Polo classique en coton piqué", "prix": 45000, "prix_promo": 35000, "stock": 50, "category_id": cat_objs["mode-homme"].id, "image_url": "https://images.unsplash.com/photo-1625910513413-5fc69d80b91a?w=400"},
        {"nom": "Robe Élégante Satin", "description": "Robe longue en satin avec bretelles fines", "prix": 55000, "prix_promo": 42000, "stock": 20, "category_id": cat_objs["mode-femme"].id, "image_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400"},
        {"nom": "Robot Mixeur Multifonction", "description": "Robot de cuisine 1000W, 10 vitesses, bol 4.5L", "prix": 85000, "prix_promo": 72000, "stock": 15, "category_id": cat_objs["maison-cuisine"].id, "image_url": "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400"},
        {"nom": "Coffret Parfum Dior", "description": "Coffret J'adore Dior 50ml + lait corps", "prix": 120000, "prix_promo": 99000, "stock": 25, "category_id": cat_objs["beaute-sante"].id, "image_url": "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400"},
        {"nom": "Ballon de Football Adidas", "description": "Ballon officiel Adidas Al Rihla, taille 5", "prix": 25000, "prix_promo": 19500, "stock": 40, "category_id": cat_objs["sports-loisirs"].id, "image_url": "https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=400"},
    ]

    for p in products_data:
        db.add(Product(**p))

    db.commit()
    db.close()
    print("Données initiales insérées avec succès!")


if __name__ == "__main__":
    seed()
