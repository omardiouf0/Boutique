import { NavLink, Outlet } from 'react-router-dom';
import { FiGrid, FiPackage, FiFolder, FiShoppingBag, FiBarChart2, FiArrowLeft } from 'react-icons/fi';
import './AdminLayout.css';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>⚙️ Admin</h2>
          <NavLink to="/" className="btn btn-ghost btn-sm">
            <FiArrowLeft /> Boutique
          </NavLink>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <FiGrid /> Tableau de bord
          </NavLink>
          <NavLink to="/admin/products" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <FiPackage /> Produits
          </NavLink>
          <NavLink to="/admin/categories" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <FiFolder /> Catégories
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <FiShoppingBag /> Commandes
          </NavLink>
          <NavLink to="/admin/inventory" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <FiBarChart2 /> Inventaire
          </NavLink>
        </nav>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
