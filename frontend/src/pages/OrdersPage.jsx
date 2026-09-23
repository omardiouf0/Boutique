import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiDownload, FiEye } from 'react-icons/fi';
import api, { API_URL } from '../api/axios';
import './OrdersPage.css';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/orders/my')
      .then(res => setOrders(res.data))
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (price) => new Intl.NumberFormat('fr-FR').format(price);
  const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const statusLabels = {
    en_attente: { label: 'En attente', class: 'badge-warning' },
    confirmee: { label: 'Confirmée', class: 'badge-info' },
    en_livraison: { label: 'En livraison', class: 'badge-primary' },
    livree: { label: 'Livrée', class: 'badge-success' },
    annulee: { label: 'Annulée', class: 'badge-danger' },
  };

  const downloadReceipt = (orderId) => {
    window.open(`${API_URL}/api/receipts/${orderId}?token=${localStorage.getItem('token')}`, '_blank');
  };

  if (loading) {
    return (
      <div className="container orders-page">
        <h1><FiPackage /> Mes Commandes</h1>
        {[1,2,3].map(i => (
          <div key={i} className="card skeleton" style={{ height: 120, marginBottom: 16 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="orders-page fade-in">
      <div className="container">
        <h1><FiPackage /> Mes Commandes</h1>

        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>Aucune commande</h3>
            <p>Vous n'avez pas encore passé de commande.</p>
            <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>Découvrir les produits</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => {
              const status = statusLabels[order.statut] || { label: order.statut, class: 'badge-info' };
              return (
                <div key={order.id} className="order-card card">
                  <div className="order-card-header">
                    <div>
                      <h3>Commande #{order.id}</h3>
                      <p className="order-date">{formatDate(order.created_at)}</p>
                    </div>
                    <span className={`badge ${status.class}`}>{status.label}</span>
                  </div>

                  <div className="order-card-items">
                    {order.items.slice(0, 3).map(item => (
                      <div key={item.id} className="order-item-mini">
                        <span>{item.product?.nom || `Produit #${item.product_id}`}</span>
                        <span className="text-muted">× {item.quantite}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                        + {order.items.length - 3} autre{order.items.length - 3 > 1 ? 's' : ''} article{order.items.length - 3 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  <div className="order-card-footer">
                    <div className="order-total">
                      <span>Total:</span>
                      <span className="price price-promo">{formatPrice(order.total)} FCFA</span>
                    </div>
                    <div className="order-actions">
                      {order.payment && (
                        <button className="btn btn-sm btn-secondary" onClick={() => downloadReceipt(order.id)}>
                          <FiDownload /> Reçu PDF
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
