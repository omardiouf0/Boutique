import { useState, useEffect } from 'react';
import { FiFolder, FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom: '', description: '', image_url: '' });
  const toast = useToast();

  const fetchCategories = () => {
    setLoading(true);
    api.get('/api/categories/').then(res => setCategories(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ nom: '', description: '', image_url: '' });
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ nom: cat.nom, description: cat.description || '', image_url: cat.image_url || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/api/categories/${editing.id}`, form);
        toast.success('Catégorie modifiée');
      } else {
        await api.post('/api/categories/', form);
        toast.success('Catégorie créée');
      }
      fetchCategories();
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.delete(`/api/categories/${id}`);
      toast.success('Catégorie supprimée');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur — la catégorie contient peut-être des produits');
    }
  };

  return (
    <div className="fade-in">
      <div className="admin-page-header">
        <h1><FiFolder /> Gestion des Catégories</h1>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Nouvelle catégorie</button>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Nom</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>Chargement des catégories...</td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>Aucune catégorie trouvée</td>
              </tr>
            ) : (
              categories.map(cat => (
                <tr key={cat.id}>
                  <td>
                    <img
                      src={cat.image_url || 'https://via.placeholder.com/40'}
                      alt=""
                      style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                    />
                  </td>
                  <td><strong>{cat.nom}</strong></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{cat.slug}</td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.description || '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(cat)}><FiEdit2 /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(cat.id)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="input-group">
                <label>Nom *</label>
                <input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea className="textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="input-group">
                <label>URL Image</label>
                <input className="input" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <button className="btn btn-primary btn-full" type="submit">
                {editing ? 'Enregistrer' : 'Créer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
