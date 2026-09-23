import { useState, useEffect } from 'react';
import { FiShoppingBag } from 'react-icons/fi';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  const fetchOrders = () => {
    setLoading(true);
    api.get('/api/orders/').then(res => setOrders(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const formatPrice = (p) => new Intl.NumberFormat('fr-FR').format(p);
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const statusOptions = [
    { value: 'en_attente', label: '⏳ En attente', class: 'badge-warning' },
    { value: 'confirmee', label: '✓ Confirmée', class: 'badge-info' },
    { value: 'en_livraison', label: '🚚 En livraison', class: 'badge-primary' },
    { value: 'livree', label: '✅ Livrée', class: 'badge-success' },
    { value: 'annulee', label: '❌ Annulée', class: 'badge-danger' },
  ];

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { statut: newStatus });
      toast.success('Statut mis à jour');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.statut === filter);

  return (
    <div className="fade-in">
      <div className="admin-page-header">
        <h1><FiShoppingBag /> Gestion des Commandes</h1>
      </div>

      {/* Status Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('all')}
        >
          Toutes ({orders.length})
        </button>
        {statusOptions.map(s => {
          const count = orders.filter(o => o.statut === s.value).length;
          return (
            <button
              key={s.value}
              className={`btn btn-sm ${filter === s.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(s.value)}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Client</th>
              <th>Téléphone</th>
              <th>Articles</th>
              <th>Total</th>
              <th>Paiement</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => (
              <tr key={order.id}>
                <td><strong>#{order.id}</strong></td>
                <td>{order.nom_client || '—'}</td>
                <td style={{ fontSize: '0.8rem' }}>{order.telephone || '—'}</td>
                <td>{order.items.length} article{order.items.length > 1 ? 's' : ''}</td>
                <td className="price">{formatPrice(order.total)} FCFA</td>
                <td>
                  {order.payment ? (
                    <span className="badge badge-success" style={{ fontSize: 11 }}>
                      {order.payment.methode === 'orange_money' ? '🟠 OM' :
                       order.payment.methode === 'wave' ? '🔵 Wave' : '💵 Cash'}
                    </span>
                  ) : <span className="badge badge-warning">Aucun</span>}
                </td>
                <td>
                  <select
                    className="select"
                    value={order.statut}
                    onChange={e => updateStatus(order.id, e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.8rem', minWidth: 140 }}
                  >
                    {statusOptions.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {formatDate(order.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && !loading && (
        <div className="empty-state">
          <p>Aucune commande trouvée</p>
        </div>
      )}
    </div>
  );
}
