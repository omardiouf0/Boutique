import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';

import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import ProductsAdmin from './pages/admin/ProductsAdmin';
import CategoriesAdmin from './pages/admin/CategoriesAdmin';
import OrdersAdmin from './pages/admin/OrdersAdmin';
import InventoryPage from './pages/admin/InventoryPage';
import SettingsPage from './pages/admin/SettingsPage';
import { applyGraphicCharter, getSavedGraphicCharter } from './utils/themeCharter';
import api from './api/axios';

import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Initialisation et synchronisation de la charte graphique
  useEffect(() => {
    const localCharter = getSavedGraphicCharter();
    if (localCharter) {
      applyGraphicCharter(localCharter);
    }

    api.get('/api/settings').then(res => {
      if (res.data) {
        applyGraphicCharter({
          charte_theme: res.data.charte_theme,
          primary_color: res.data.primary_color,
          primary_dark: res.data.primary_dark,
          primary_light: res.data.primary_light,
          primary_bg: res.data.primary_bg,
          border_radius_theme: res.data.border_radius_theme,
        });
      }
    }).catch(() => {});
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app">
      <ScrollToTop />
      {!isAdminRoute && <Navbar theme={theme} toggleTheme={toggleTheme} />}
      <CartDrawer />

      <main className={isAdminRoute ? '' : 'main-content'}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route path="/checkout" element={
            <ProtectedRoute><CheckoutPage /></ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute><OrdersPage /></ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsAdmin />} />
            <Route path="categories" element={<CategoriesAdmin />} />
            <Route path="orders" element={<OrdersAdmin />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="container" style={{ padding: '120px 16px', textAlign: 'center' }}>
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h2>Page introuvable</h2>
                <p>La page que vous cherchez n'existe pas.</p>
                <a href="/" className="btn btn-primary" style={{ marginTop: '16px' }}>Retour à l'accueil</a>
              </div>
            </div>
          } />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default App;
