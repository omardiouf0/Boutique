import { useState, useEffect } from 'react';
import { FiPackage, FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import api, { API_URL } from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom: '', description: '', prix: '', prix_promo: '', stock: '', category_id: '', image_url: '', is_active: true });
  const toast = useToast();

  const fetchProducts = () => {
    setLoading(true);
    api.get('/api/products/all').then(res => setProducts(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
    api.get('/api/categories/').then(res => setCategories(res.data));
  }, []);

  const formatPrice = (p) => new Intl.NumberFormat('fr-FR').format(p);

  const openCreate = () => {
    setEditing(null);
    setForm({ nom: '', description: '', prix: '', prix_promo: '', stock: '0', category_id: categories[0]?.id || '', image_url: '', is_active: true });
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      nom: product.nom,
      description: product.description || '',
      prix: product.prix,
      prix_promo: product.prix_promo || '',
      stock: product.stock,
      category_id: product.category_id,
      image_url: product.image_url || '',
      is_active: product.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      prix: parseFloat(form.prix),
      prix_promo: form.prix_promo ? parseFloat(form.prix_promo) : null,
      stock: parseInt(form.stock),
      category_id: parseInt(form.category_id),
    };

    try {
      if (editing) {
        await api.put(`/api/products/${editing.id}`, data);
        toast.success('Produit modifié');
      } else {
        await api.post('/api/products/', data);
        toast.success('Produit créé');
      }
      fetchProducts();
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      toast.success('Produit supprimé');
      fetchProducts();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/api/products/upload-image', fd);
      setForm(prev => ({ ...prev, image_url: res.data.url }));
      toast.success('Image uploadée');
    } catch (err) {
      toast.error('Erreur upload image');
    }
  };

  const filtered = products.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="admin-page-header">
        <h1><FiPackage /> Gestion des Produits</h1>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Ajouter un produit</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16, position: 'relative', maxWidth: 400 }}>
        <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="input"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Nom</th>
              <th>Catégorie</th>
              <th>Prix</th>
              <th>Stock</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => (
              <tr key={product.id}>
                <td>
                  <img
                    src={product.image_url?.startsWith('http') ? product.image_url : product.image_url ? `${API_URL}${product.image_url}` : 'https://via.placeholder.com/40'}
                    alt=""
                    style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                  />
                </td>
                <td><strong>{product.nom}</strong></td>
                <td>{product.category?.nom || '—'}</td>
                <td>
                  <span className="price">{formatPrice(product.prix_promo || product.prix)} FCFA</span>
                  {product.prix_promo && <span className="price-old" style={{ display: 'block' }}>{formatPrice(product.prix)}</span>}
                </td>
                <td>
                  <span className={`badge ${product.stock <= 5 ? 'badge-danger' : product.stock <= 15 ? 'badge-warning' : 'badge-success'}`}>
                    {product.stock}
                  </span>
                </td>
                <td>
                  <span className={`badge ${product.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {product.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(product)}><FiEdit2 /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(product.id)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Modifier le produit' : 'Nouveau produit'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="input-group">
                <label>Nom *</label>
                <input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Catégorie *</label>
                <select className="select" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required>
                  <option value="">Sélectionner...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label>Prix (FCFA) *</label>
                  <input className="input" type="number" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label>Prix promo</label>
                  <input className="input" type="number" value={form.prix_promo} onChange={e => setForm({ ...form, prix_promo: e.target.value })} />
                </div>
              </div>
              <div className="input-group">
                <label>Stock *</label>
                <input className="input" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea className="textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="input-group">
                <label>URL Image</label>
                <input className="input" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://... ou upload ci-dessous" />
              </div>
              <div className="input-group">
                <label>Ou uploader une image</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                Produit actif (visible en boutique)
              </label>
              <button className="btn btn-primary btn-full" type="submit">
                {editing ? 'Enregistrer' : 'Créer le produit'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
