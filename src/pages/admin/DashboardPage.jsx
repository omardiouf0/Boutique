import { useState, useEffect } from 'react';
import { FiDollarSign, FiShoppingBag, FiPackage, FiAlertTriangle, FiTrendingUp } from 'react-icons/fi';
import api from '../../api/axios';
import './DashboardPage.css';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/dashboard/stats')
      .then(res => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (price) => new Intl.NumberFormat('fr-FR').format(price);

  const statusLabels = {
    en_attente: { label: 'En attente', class: 'badge-warning' },
    confirmee: { label: 'Confirmée', class: 'badge-info' },
    en_livraison: { label: 'En livraison', class: 'badge-primary' },
    livree: { label: 'Livrée', class: 'badge-success' },
    annulee: { label: 'Annulée', class: 'badge-danger' },
  };

  if (loading) {
    return (
      <div>
        <h1 className="admin-page-title"><FiTrendingUp /> Tableau de bord</h1>
        <div className="kpi-grid">
          {[1,2,3,4].map(i => <div key={i} className="card skeleton" style={{ height: 120 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      <h1 className="admin-page-title"><FiTrendingUp /> Tableau de bord</h1>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card card">
          <div className="kpi-icon revenue"><FiDollarSign /></div>
          <div className="kpi-info">
            <p className="kpi-label">Chiffre d'affaires</p>
            <h2>{formatPrice(stats.total_revenue)} FCFA</h2>
          </div>
        </div>
        <div className="kpi-card card">
          <div className="kpi-icon orders"><FiShoppingBag /></div>
          <div className="kpi-info">
            <p className="kpi-label">Commandes totales</p>
            <h2>{stats.total_orders}</h2>
            <p className="kpi-sub">{stats.orders_today} aujourd'hui</p>
          </div>
        </div>
        <div className="kpi-card card">
          <div className="kpi-icon products"><FiPackage /></div>
          <div className="kpi-info">
            <p className="kpi-label">Produits</p>
            <h2>{stats.total_products}</h2>
          </div>
        </div>
        <div className="kpi-card card">
          <div className="kpi-icon alert"><FiAlertTriangle /></div>
          <div className="kpi-info">
            <p className="kpi-label">Stock faible</p>
            <h2>{stats.low_stock_products}</h2>
            <p className="kpi-sub">produits ≤ 5 unités</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="dashboard-section">
        <h2>📋 Commandes récentes</h2>
        {stats.recent_orders.length === 0 ? (
          <div className="empty-state">
            <p>Aucune commande pour le moment</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th>Paiement</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_orders.map(order => {
                  const status = statusLabels[order.statut] || { label: order.statut, class: 'badge-info' };
                  return (
                    <tr key={order.id}>
                      <td><strong>#{order.id}</strong></td>
                      <td>{order.nom_client || '—'}</td>
                      <td className="price">{formatPrice(order.total)} FCFA</td>
                      <td><span className={`badge ${status.class}`}>{status.label}</span></td>
                      <td>
                        {order.payment ? (
                          <span className="badge badge-success">
                            {order.payment.methode === 'orange_money' ? '🟠 OM' :
                             order.payment.methode === 'wave' ? '🔵 Wave' : '💵 Cash'}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
