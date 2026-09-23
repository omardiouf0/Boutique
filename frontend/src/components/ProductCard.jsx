import { Link } from 'react-router-dom';
import { FiShoppingCart, FiStar } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { API_URL } from '../api/axios';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const toast = useToast();

  const hasPromo = product.prix_promo && product.prix_promo < product.prix;
  const discount = hasPromo ? Math.round((1 - product.prix_promo / product.prix) * 100) : 0;
  const displayPrice = hasPromo ? product.prix_promo : product.prix;

  const imageUrl = product.image_url?.startsWith('http')
    ? product.image_url
    : product.image_url
      ? `${API_URL}${product.image_url}`
      : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) {
      toast.error('Produit en rupture de stock');
      return;
    }
    addItem(product);
    toast.success(`${product.nom} ajouté au panier`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  return (
    <Link to={`/products/${product.id}`} className="product-card card">
      <div className="product-card-image">
        <img src={imageUrl} alt={product.nom} loading="lazy" />
        {hasPromo && <span className="discount-badge">-{discount}%</span>}
        {product.stock <= 0 && <span className="out-of-stock-badge">Rupture</span>}
      </div>

      <div className="product-card-body">
        {product.category && (
          <span className="product-card-category">{product.category.nom}</span>
        )}
        <h3 className="product-card-title">{product.nom}</h3>

        <div className="product-card-rating">
          {[1,2,3,4,5].map(i => (
            <FiStar key={i} className={i <= 4 ? 'star-filled' : ''} />
          ))}
          <span>(4.0)</span>
        </div>

        <div className="product-card-price">
          <span className="price price-promo">{formatPrice(displayPrice)} FCFA</span>
          {hasPromo && <span className="price-old">{formatPrice(product.prix)} FCFA</span>}
        </div>

        <button
          className="btn btn-primary btn-sm btn-full product-card-btn"
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
        >
          <FiShoppingCart />
          {product.stock > 0 ? 'Ajouter au panier' : 'Indisponible'}
        </button>
      </div>
    </Link>
  );
}
