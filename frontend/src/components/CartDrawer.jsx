import { Link } from 'react-router-dom';
import { FiX, FiPlus, FiMinus, FiShoppingBag, FiTrash2 } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import './CartDrawer.css';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, getItemPrice } = useCart();

  const formatPrice = (price) => new Intl.NumberFormat('fr-FR').format(price);

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-overlay" onClick={() => setIsOpen(false)} />
      <div className="cart-drawer">
        <div className="cart-drawer-header">
          <h2><FiShoppingBag /> Panier ({items.length})</h2>
          <button className="modal-close" onClick={() => setIsOpen(false)}>
            <FiX />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 24px' }}>
            <div className="empty-state-icon">🛒</div>
            <h3>Votre panier est vide</h3>
            <p>Découvrez nos produits et commencez vos achats !</p>
            <Link to="/products" className="btn btn-primary" onClick={() => setIsOpen(false)} style={{ marginTop: '16px' }}>
              Explorer les produits
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                    alt={item.nom}
                    className="cart-item-img"
                  />
                  <div className="cart-item-info">
                    <h4>{item.nom}</h4>
                    <p className="price price-promo">{formatPrice(getItemPrice(item))} FCFA</p>
                    <div className="cart-item-qty">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <FiMinus />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <FiPlus />
                      </button>
                      <button className="cart-item-remove" onClick={() => removeItem(item.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total">
                <span>Total</span>
                <span className="price price-promo">{formatPrice(totalPrice)} FCFA</span>
              </div>
              <Link
                to="/checkout"
                className="btn btn-primary btn-lg btn-full"
                onClick={() => setIsOpen(false)}
              >
                Commander ({items.length} articles)
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
