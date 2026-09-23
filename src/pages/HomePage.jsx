import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiTrendingUp, FiZap, FiTruck, FiShield, FiHeadphones } from 'react-icons/fi';
import api, { API_URL } from '../api/axios';
import ProductCard from '../components/ProductCard';
import './HomePage.css';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/products/?limit=8&sort=recent'),
      api.get('/api/categories/'),
      api.get('/api/settings').catch(() => ({ data: null }))
    ]).then(([prodRes, catRes, setRes]) => {
      setProducts(prodRes.data);
      setCategories(catRes.data);
      if (setRes?.data) setSettings(setRes.data);
    }).finally(() => setLoading(false));

    const handleSettingsUpdate = () => {
      api.get('/api/settings').then(res => {
        if (res.data) setSettings(res.data);
      }).catch(() => {});
    };
    window.addEventListener('settings-changed', handleSettingsUpdate);
    return () => window.removeEventListener('settings-changed', handleSettingsUpdate);
  }, []);

  const promoProducts = products.filter(p => p.prix_promo && p.prix_promo < p.prix);

  const headerImageUrl = settings?.image_entete
    ? (settings.image_entete.startsWith('http') || settings.image_entete.startsWith('data:')
        ? settings.image_entete
        : `${API_URL}${settings.image_entete}`)
    : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600';

  return (
    <div className="home-page fade-in">
      {/* Hero Banner */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <span className="hero-badge">🔥 Nouvelles Offres</span>
              <h1>Les Meilleurs Prix<br /><span>Livrés Chez Vous</span></h1>
              <p>Découvrez des milliers de produits de qualité. Payez avec Orange Money, Wave ou sur place.</p>
              <div className="hero-actions">
                <Link to="/products" className="btn btn-primary btn-lg">
                  Explorer la boutique <FiArrowRight />
                </Link>
              </div>
            </div>
            <div className="hero-image">
              <img
                src={headerImageUrl}
                alt={settings?.nom_site || "En-tête de la boutique"}
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon"><FiTruck /></div>
              <div><h4>Livraison Rapide</h4><p>Partout au Sénégal</p></div>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><FiShield /></div>
              <div><h4>Paiement Sécurisé</h4><p>Orange Money & Wave</p></div>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><FiZap /></div>
              <div><h4>Offres Flash</h4><p>Promotions quotidiennes</p></div>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><FiHeadphones /></div>
              <div><h4>Support 24/7</h4><p>Service client dédié</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="section-title">📂 Nos Catégories</h2>
            <div className="categories-grid">
              {categories.map(cat => (
                <Link key={cat.id} to={`/products?category=${cat.id}`} className="category-card card">
                  <div className="category-card-image">
                    <img src={cat.image_url || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300'} alt={cat.nom} />
                  </div>
                  <div className="category-card-body">
                    <h3>{cat.nom}</h3>
                    <span className="category-arrow"><FiArrowRight /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Flash Deals */}
      {promoProducts.length > 0 && (
        <section className="section flash-section">
          <div className="container">
            <h2 className="section-title"><FiZap /> Offres Flash</h2>
            <div className="products-grid">
              {promoProducts.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title"><FiTrendingUp /> Produits Populaires</h2>
            <Link to="/products" className="btn btn-secondary btn-sm">
              Voir tout <FiArrowRight />
            </Link>
          </div>
          {loading ? (
            <div className="products-grid">
              {[1,2,3,4].map(i => (
                <div key={i} className="card" style={{ height: 360 }}>
                  <div className="skeleton" style={{ height: '60%' }} />
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="skeleton" style={{ height: 16, width: '70%' }} />
                    <div className="skeleton" style={{ height: 14, width: '50%' }} />
                    <div className="skeleton" style={{ height: 20, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="products-grid">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2>Prêt à faire vos achats ?</h2>
            <p>Inscrivez-vous et bénéficiez de remises exclusives sur votre première commande.</p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Créer un compte gratuit <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
