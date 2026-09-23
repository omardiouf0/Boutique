import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import api from '../api/axios';
import './Footer.css';

export default function Footer() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.get('/api/settings')
      .then(res => setSettings(res.data))
      .catch(() => {});
  }, []);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <h3 className="footer-logo">🛒 {settings?.nom_site || 'BazarShop'}</h3>
            <p className="footer-desc">
              {settings?.slogan || 'Votre boutique en ligne de confiance. Les meilleurs produits aux meilleurs prix, livrés chez vous.'}
            </p>
            <div className="footer-payment">
              {settings?.orange_money_active !== false && (
                <span className="payment-badge orange-money">
                  {settings?.orange_money_logo ? (
                    <img src={settings.orange_money_logo} alt="Orange Money" />
                  ) : (
                    <span>🟠</span>
                  )}
                  <span>Orange Money</span>
                </span>
              )}
              {settings?.wave_active !== false && (
                <span className="payment-badge wave">
                  {settings?.wave_logo ? (
                    <img src={settings.wave_logo} alt="Wave" />
                  ) : (
                    <span>🔵</span>
                  )}
                  <span>Wave</span>
                </span>
              )}
              {settings?.paiement_sur_place_active !== false && (
                <span className="payment-badge cash">
                  <span>💵</span>
                  <span>Sur Place</span>
                </span>
              )}
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
              <FiPhone /> {settings?.telephone_contact || '+221 33 800 00 00'}
            </div>
            <div className="footer-contact-item">
              <FiMail /> {settings?.email_contact || 'contact@bazarshop.com'}
            </div>
            <div className="footer-contact-item">
              <FiMapPin /> {settings?.adresse_physique || 'Dakar, Sénégal'}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {settings?.nom_site || 'BazarShop'}. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
