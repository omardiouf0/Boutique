import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX, FiSun, FiMoon, FiPackage, FiLogOut, FiGrid, FiBell } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import api from '../api/axios';
import './Navbar.css';

export default function Navbar({ theme, toggleTheme }) {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems, setIsOpen } = useCart();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/settings')
      .then(res => setSettings(res.data))
      .catch(() => {});

    const handleSettingsUpdate = (e) => {
      if (e?.detail) {
        setSettings(e.detail);
      } else {
        api.get('/api/settings')
          .then(res => setSettings(res.data))
          .catch(() => {});
      }
    };

    window.addEventListener('settings-changed', handleSettingsUpdate);
    return () => window.removeEventListener('settings-changed', handleSettingsUpdate);
  }, []);

  const formatLogoText = (name) => {
    if (!name) return <>Bazar<span>Shop</span></>;
    const clean = name.trim();

    // If multiple words (e.g. "Ndiaye Shop", "Marché Express")
    const lastSpace = clean.lastIndexOf(' ');
    if (lastSpace !== -1) {
      const firstPart = clean.substring(0, lastSpace);
      const lastPart = clean.substring(lastSpace + 1);
      return (
        <>
          {firstPart} <span>{lastPart}</span>
        </>
      );
    }

    // If compound word ending with Shop/Store/Market (e.g. "BazarShop", "NdiayeShop")
    const match = clean.match(/^(.*?)(shop|store|bazar|market)$/i);
    if (match && match[1].length > 0) {
      return (
        <>
          {match[1]}<span>{match[2]}</span>
        </>
      );
    }

    return <>{clean}</>;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <>
      {settings?.banniere_annonce_active && settings?.banniere_annonce_texte && (
        <div style={{
          background: 'linear-gradient(90deg, #F68B1E, #e0770e)',
          color: 'white',
          padding: '7px 16px',
          textAlign: 'center',
          fontSize: '12.5px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          letterSpacing: '0.2px'
        }}>
          <FiBell style={{ fontSize: '14px' }} />
          <span>{settings.banniere_annonce_texte}</span>
        </div>
      )}
      <nav className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="navbar-logo">
            🛒 {formatLogoText(settings?.nom_site)}
          </Link>

        <form className="navbar-search" onSubmit={handleSearch}>
          <FiSearch className="navbar-search-icon" />
          <input
            type="text"
            placeholder="Rechercher des produits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="navbar-actions">
          <button className="theme-toggle desktop-only" onClick={toggleTheme} title="Changer le thème">
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>

          <button className="navbar-cart-btn" onClick={() => setIsOpen(true)}>
            <FiShoppingCart />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>

          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="navbar-user-btn desktop-only">
                  <FiGrid />
                  <span>Admin</span>
                </Link>
              )}
              <Link to="/orders" className="navbar-user-btn desktop-only">
                <FiPackage />
                <span>Commandes</span>
              </Link>
              <button className="navbar-user-btn desktop-only" onClick={handleLogout}>
                <FiLogOut />
                <span>Déconnexion</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="navbar-user-btn desktop-only">
              <FiUser />
              <span>Connexion</span>
            </Link>
          )}

          <button className="hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <form onSubmit={handleSearch} style={{ padding: '0' }}>
          <input
            className="input"
            type="text"
            placeholder="🔍 Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: '8px' }}
          />
        </form>

        <Link to="/products" onClick={() => setMobileOpen(false)}>📦 Tous les produits</Link>

        {user ? (
          <>
            <Link to="/orders" onClick={() => setMobileOpen(false)}>📋 Mes commandes</Link>
            {isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)}>⚙️ Administration</Link>}
            <button onClick={handleLogout}>🚪 Déconnexion</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setMobileOpen(false)} className="btn btn-primary">Se connecter</Link>
            <Link to="/register" onClick={() => setMobileOpen(false)}>📝 Créer un compte</Link>
          </>
        )}

        <button onClick={() => { toggleTheme(); }}>
          {theme === 'dark' ? '☀️ Mode clair' : '🌙 Mode sombre'}
        </button>
      </div>
    </nav>
  </>
  );
}
