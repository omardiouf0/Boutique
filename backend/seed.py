"""
Seed script — Creates a default admin user and demo categories/products.
Run with: python seed.py
"""
from database import engine, SessionLocal, Base
from models import User, Category, Product, UserRole
from auth import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ─── Admin User ─────────────────────────────────────────────────────
admin = db.query(User).filter(User.email == "admin@bazarshop.com").first()
if not admin:
    admin = User(
        nom="Administrateur",
        email="admin@bazarshop.com",
        password_hash=hash_password("admin123"),
        telephone="+221770000000",
        role=UserRole.admin.value
    )
    db.add(admin)
    db.commit()
    print("✅ Admin créé : admin@bazarshop.com / admin123")
else:
    print("ℹ️  Admin existe déjà")

# ─── Categories ─────────────────────────────────────────────────────
categories_data = [
    {"nom": "Électronique", "description": "Smartphones, tablettes, ordinateurs et accessoires", "slug": "electronique", "image_url": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400"},
    {"nom": "Mode Homme", "description": "Vêtements, chaussures et accessoires pour homme", "slug": "mode-homme", "image_url": "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=400"},
    {"nom": "Mode Femme", "description": "Vêtements, chaussures et accessoires pour femme", "slug": "mode-femme", "image_url": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400"},
    {"nom": "Maison & Cuisine", "description": "Meubles, décoration et ustensiles de cuisine", "slug": "maison-cuisine", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400"},
    {"nom": "Beauté & Santé", "description": "Cosmétiques, soins et produits de santé", "slug": "beaute-sante", "image_url": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400"},
    {"nom": "Sports & Loisirs", "description": "Équipements sportifs et articles de loisirs", "slug": "sports-loisirs", "image_url": "https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=400"},
]

for cat_data in categories_data:
    existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
    if not existing:
        cat = Category(**cat_data)
        db.add(cat)
        print(f"✅ Catégorie créée : {cat_data['nom']}")

db.commit()

# ─── Products ───────────────────────────────────────────────────────
categories = {c.slug: c.id for c in db.query(Category).all()}

products_data = [
    # Électronique
    {"nom": "iPhone 15 Pro Max", "description": "Apple iPhone 15 Pro Max 256GB, écran Super Retina XDR 6.7 pouces", "prix": 850000, "prix_promo": 799000, "stock": 15, "category_id": categories.get("electronique"), "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400"},
    {"nom": "Samsung Galaxy S24 Ultra", "description": "Samsung Galaxy S24 Ultra 256GB, S Pen intégré, écran 6.8 pouces", "prix": 780000, "prix_promo": 725000, "stock": 20, "category_id": categories.get("electronique"), "image_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400"},
    {"nom": "MacBook Air M3", "description": "Apple MacBook Air 15 pouces avec puce M3, 8GB RAM, 256GB SSD", "prix": 950000, "stock": 8, "category_id": categories.get("electronique"), "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"},
    {"nom": "Écouteurs AirPods Pro 2", "description": "Apple AirPods Pro 2e génération avec boîtier de charge MagSafe", "prix": 175000, "prix_promo": 155000, "stock": 30, "category_id": categories.get("electronique"), "image_url": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400"},
    {"nom": "Tablette iPad Air", "description": "Apple iPad Air 11 pouces, puce M2, 128GB", "prix": 450000, "stock": 12, "category_id": categories.get("electronique"), "image_url": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400"},

    # Mode Homme
    {"nom": "Polo Ralph Lauren Classic", "description": "Polo classique en coton piqué, coupe régulière, logo brodé", "prix": 45000, "prix_promo": 35000, "stock": 50, "category_id": categories.get("mode-homme"), "image_url": "https://images.unsplash.com/photo-1625910513413-5fc69d80b91a?w=400"},
    {"nom": "Jean Slim Levi's 511", "description": "Jean slim fit en denim stretch, coloris bleu indigo", "prix": 38000, "stock": 35, "category_id": categories.get("mode-homme"), "image_url": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400"},
    {"nom": "Sneakers Nike Air Max", "description": "Nike Air Max 90 Essential, coussin d'air visible, confort optimal", "prix": 75000, "prix_promo": 65000, "stock": 25, "category_id": categories.get("mode-homme"), "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"},

    # Mode Femme
    {"nom": "Robe Élégante Satin", "description": "Robe longue en satin avec bretelles fines, idéale pour les soirées", "prix": 55000, "prix_promo": 42000, "stock": 20, "category_id": categories.get("mode-femme"), "image_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400"},
    {"nom": "Sac à Main Cuir", "description": "Sac à main en cuir véritable, compartiments multiples, bandoulière amovible", "prix": 65000, "stock": 18, "category_id": categories.get("mode-femme"), "image_url": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400"},
    {"nom": "Sandales à Talons", "description": "Sandales élégantes à talons hauts, brides croisées", "prix": 35000, "prix_promo": 28000, "stock": 22, "category_id": categories.get("mode-femme"), "image_url": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400"},

    # Maison & Cuisine
    {"nom": "Robot Mixeur Multifonction", "description": "Robot de cuisine 1000W, 10 vitesses, bol 4.5L, lames inox", "prix": 85000, "prix_promo": 72000, "stock": 15, "category_id": categories.get("maison-cuisine"), "image_url": "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400"},
    {"nom": "Set de Casseroles Premium", "description": "Ensemble 5 pièces en acier inoxydable, fond thermique", "prix": 95000, "stock": 10, "category_id": categories.get("maison-cuisine"), "image_url": "https://images.unsplash.com/photo-1584990347449-a6330c1c5e6b?w=400"},

    # Beauté & Santé
    {"nom": "Coffret Parfum Dior", "description": "Coffret J'adore Dior: eau de parfum 50ml + lait corps 75ml", "prix": 120000, "prix_promo": 99000, "stock": 25, "category_id": categories.get("beaute-sante"), "image_url": "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400"},
    {"nom": "Crème Hydratante Nivea", "description": "Crème hydratante visage et corps, pot 400ml", "prix": 8500, "stock": 100, "category_id": categories.get("beaute-sante"), "image_url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400"},

    # Sports & Loisirs
    {"nom": "Ballon de Football Adidas", "description": "Ballon officiel Adidas Al Rihla, taille 5, cousu main", "prix": 25000, "prix_promo": 19500, "stock": 40, "category_id": categories.get("sports-loisirs"), "image_url": "https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=400"},
    {"nom": "Tapis de Yoga Premium", "description": "Tapis antidérapant 6mm, matériaux écologiques, avec sangle", "prix": 18000, "stock": 30, "category_id": categories.get("sports-loisirs"), "image_url": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400"},
]

for prod_data in products_data:
    if prod_data["category_id"] is None:
        continue
    existing = db.query(Product).filter(Product.nom == prod_data["nom"]).first()
    if not existing:
        product = Product(**prod_data)
        db.add(product)
        print(f"✅ Produit créé : {prod_data['nom']}")

db.commit()
db.close()

print("\n🎉 Base de données initialisée avec succès !")
print("👤 Admin: admin@bazarshop.com / admin123")
