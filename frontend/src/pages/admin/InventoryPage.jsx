import { useState, useEffect } from 'react';
import { FiBarChart2, FiAlertTriangle, FiSave } from 'react-icons/fi';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockEdits, setStockEdits] = useState({});
  const [filter, setFilter] = useState('all'); // all, low, out
  const toast = useToast();

  const fetchProducts = () => {
    setLoading(true);
    api.get('/api/products/all').then(res => setProducts(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleStockChange = (productId, value) => {
    setStockEdits(prev => ({ ...prev, [productId]: parseInt(value) || 0 }));
  };

  const saveStock = async (productId) => {
    const newStock = stockEdits[productId];
    if (newStock === undefined) return;

    try {
      await api.patch(`/api/products/${productId}/stock`, { stock: newStock });
      toast.success('Stock mis à jour');
      setStockEdits(prev => { const n = { ...prev }; delete n[productId]; return n; });
      fetchProducts();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const saveAllStocks = async () => {
    const entries = Object.entries(stockEdits);
    if (entries.length === 0) {
      toast.info('Aucune modification');
      return;
    }

    try {
      for (const [id, stock] of entries) {
        await api.patch(`/api/products/${id}/stock`, { stock });
      }
      toast.success(`${entries.length} produit(s) mis à jour`);
      setStockEdits({});
      fetchProducts();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  let filtered = products;
  if (filter === 'low') filtered = products.filter(p => p.stock > 0 && p.stock <= 5);
  if (filter === 'out') filtered = products.filter(p => p.stock === 0);

  const lowCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outCount = products.filter(p => p.stock === 0).length;

  return (
    <div className="fade-in">
      <div className="admin-page-header">
        <h1><FiBarChart2 /> Inventaire</h1>
        {Object.keys(stockEdits).length > 0 && (
          <button className="btn btn-primary" onClick={saveAllStocks}>
            <FiSave /> Enregistrer tout ({Object.keys(stockEdits).length})
          </button>
        )}
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')}>
          Tous ({products.length})
        </button>
        <button className={`btn btn-sm ${filter === 'low' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('low')}>
          <FiAlertTriangle /> Stock faible ({lowCount})
        </button>
        <button className={`btn btn-sm ${filter === 'out' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('out')}>
          ❌ Rupture ({outCount})
        </button>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Prix</th>
              <th>Stock actuel</th>
              <th>Nouveau stock</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => {
              const hasEdit = stockEdits[product.id] !== undefined;
              const currentStock = hasEdit ? stockEdits[product.id] : product.stock;

              return (
                <tr key={product.id} style={product.stock === 0 ? { background: 'var(--danger-bg)' } : product.stock <= 5 ? { background: 'var(--warning-bg)' } : {}}>
                  <td><strong>{product.nom}</strong></td>
                  <td>{product.category?.nom || '—'}</td>
                  <td className="price">{new Intl.NumberFormat('fr-FR').format(product.prix)} FCFA</td>
                  <td>
                    <span className={`badge ${product.stock === 0 ? 'badge-danger' : product.stock <= 5 ? 'badge-warning' : 'badge-success'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={currentStock}
                      onChange={e => handleStockChange(product.id, e.target.value)}
                      style={{ width: 100, padding: '8px 12px' }}
                    />
                  </td>
                  <td>
                    {product.stock === 0 ? (
                      <span className="badge badge-danger">Rupture</span>
                    ) : product.stock <= 5 ? (
                      <span className="badge badge-warning">⚠ Faible</span>
                    ) : (
                      <span className="badge badge-success">OK</span>
                    )}
                  </td>
                  <td>
                    {hasEdit && (
                      <button className="btn btn-sm btn-primary" onClick={() => saveStock(product.id)}>
                        <FiSave />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
