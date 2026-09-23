import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <h3 className="footer-logo">🛒 BazarShop</h3>
            <p className="footer-desc">
              Votre boutique en ligne de confiance. Les meilleurs produits aux meilleurs prix, livrés chez vous.
            </p>
            <div className="footer-payment">
              <span className="payment-badge orange-money">🟠 Orange Money</span>
              <span className="payment-badge wave">🔵 Wave</span>
              <span className="payment-badge cash">💵 Sur Place</span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Navigation</h4>
            <Link to="/">Accueil</Link>
            <Link to="/products">Tous les produits</Link>
            <Link to="/login">Mon compte</Link>
            <Link to="/orders">Mes commandes</Link>
          </div>

          <div className="footer-col">
            <h4>Catégories</h4>
            <Link to="/products?category=1">Électronique</Link>
            <Link to="/products?category=2">Mode Homme</Link>
            <Link to="/products?category=3">Mode Femme</Link>
            <Link to="/products?category=4">Maison & Cuisine</Link>
          </div>

          <div className="footer-col">
            <h4>Contact</h4>
            <div className="footer-contact-item">
              <FiPhone /> +221 77 000 00 00
            </div>
            <div className="footer-contact-item">
              <FiMail /> contact@bazarshop.com
            </div>
            <div className="footer-contact-item">
              <FiMapPin /> Dakar, Sénégal
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} BazarShop. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
