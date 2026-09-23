from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import Base, engine
from routers import auth, categories, products, orders, payments, dashboard, receipts

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BazarShop API",
    description="API E-Commerce style Jumia",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(dashboard.router)
app.include_router(receipts.router)


@app.get("/")
def root():
    return {"message": "Bienvenue sur l'API BazarShop", "docs": "/docs"}
