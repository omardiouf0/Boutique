import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiShoppingCart, FiMinus, FiPlus, FiArrowLeft, FiStar, FiTruck, FiShield } from 'react-icons/fi';
import api, { API_URL } from '../api/axios';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import ProductCard from '../components/ProductCard';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    setQuantity(1);
    api.get(`/api/products/${id}`)
      .then(res => {
        setProduct(res.data);
        // fetch related
        return api.get(`/api/products/?category_id=${res.data.category_id}&limit=4`);
      })
      .then(res => {
        setRelated(res.data.filter(p => p.id !== parseInt(id)));
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '48px 16px' }}>
        <div className="product-detail-grid">
          <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ height: 24, width: '30%' }} />
            <div className="skeleton" style={{ height: 36, width: '80%' }} />
            <div className="skeleton" style={{ height: 60 }} />
            <div className="skeleton" style={{ height: 40, width: '50%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <h3>Produit non trouvé</h3>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>
            Retour aux produits
          </Link>
        </div>
      </div>
    );
  }

  const hasPromo = product.prix_promo && product.prix_promo < product.prix;
  const discount = hasPromo ? Math.round((1 - product.prix_promo / product.prix) * 100) : 0;
  const displayPrice = hasPromo ? product.prix_promo : product.prix;
  const formatPrice = (price) => new Intl.NumberFormat('fr-FR').format(price);

  const imageUrl = product.image_url?.startsWith('http')
    ? product.image_url
    : product.image_url
      ? `${API_URL}${product.image_url}`
      : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';

  const handleAddToCart = () => {
    if (product.stock <= 0) {
      toast.error('Produit en rupture de stock');
      return;
    }
    addItem(product, quantity);
    toast.success(`${quantity}x ${product.nom} ajouté au panier`);
  };

  return (
    <div className="product-detail-page fade-in">
      <div className="container">
        <Link to="/products" className="back-link">
          <FiArrowLeft /> Retour aux produits
        </Link>

        <div className="product-detail-grid">
          {/* Image */}
          <div className="product-detail-image">
            <img src={imageUrl} alt={product.nom} />
            {hasPromo && <span className="discount-badge" style={{ fontSize: '1rem', padding: '6px 14px' }}>-{discount}%</span>}
          </div>

          {/* Info */}
          <div className="product-detail-info">
            {product.category && (
              <Link to={`/products?category=${product.category.id}`} className="product-detail-category">
                {product.category.nom}
              </Link>
            )}

            <h1>{product.nom}</h1>

            <div className="product-detail-rating">
              {[1,2,3,4,5].map(i => (
                <FiStar key={i} className={i <= 4 ? 'star-filled' : ''} />
              ))}
              <span>4.0 (12 avis)</span>
            </div>

            <div className="product-detail-price">
              <span className="price price-promo" style={{ fontSize: '2rem' }}>
                {formatPrice(displayPrice)} FCFA
              </span>
              {hasPromo && (
                <span className="price-old" style={{ fontSize: '1.1rem' }}>
                  {formatPrice(product.prix)} FCFA
                </span>
              )}
            </div>

            {product.description && (
              <p className="product-detail-desc">{product.description}</p>
            )}

            <div className="product-detail-stock">
              {product.stock > 0 ? (
                <span className="badge badge-success">✓ En stock ({product.stock} disponible{product.stock > 1 ? 's' : ''})</span>
              ) : (
                <span className="badge badge-danger">Rupture de stock</span>
              )}
            </div>

            {product.stock > 0 && (
              <div className="product-detail-actions">
                <div className="quantity-selector">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><FiMinus /></button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}><FiPlus /></button>
                </div>
                <button className="btn btn-primary btn-lg" onClick={handleAddToCart} style={{ flex: 1 }}>
                  <FiShoppingCart /> Ajouter au panier
                </button>
              </div>
            )}

            <div className="product-detail-features">
              <div className="detail-feature">
                <FiTruck /> Livraison rapide partout au Sénégal
              </div>
              <div className="detail-feature">
                <FiShield /> Paiement sécurisé Orange Money & Wave
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="section">
            <h2 className="section-title">Produits Similaires</h2>
            <div className="products-grid">
              {related.slice(0, 4).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
