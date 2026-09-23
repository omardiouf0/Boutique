import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiX } from 'react-icons/fi';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import './ProductsPage.css';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const categoryId = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'recent';

  useEffect(() => {
    api.get('/api/categories/').then(res => setCategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryId) params.append('category_id', categoryId);
    if (search) params.append('search', search);
    if (sort) params.append('sort', sort);
    params.append('limit', '50');

    api.get(`/api/products/?${params.toString()}`)
      .then(res => setProducts(res.data))
      .finally(() => setLoading(false));
  }, [categoryId, search, sort]);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const activeCategory = categories.find(c => c.id === parseInt(categoryId));

  return (
    <div className="products-page fade-in">
      <div className="container">
        <div className="products-page-header">
          <div>
            <h1>
              {activeCategory ? activeCategory.nom : search ? `Résultats pour "${search}"` : 'Tous les Produits'}
            </h1>
            <p className="text-muted">{products.length} produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}</p>
          </div>
          <button className="btn btn-secondary filter-toggle" onClick={() => setShowFilters(!showFilters)}>
            <FiFilter /> Filtres
          </button>
        </div>

        <div className="products-layout">
          {/* Sidebar Filters */}
          <aside className={`filters-sidebar ${showFilters ? 'open' : ''}`}>
            <div className="filters-header">
              <h3>Filtres</h3>
              <button className="filter-close" onClick={() => setShowFilters(false)}><FiX /></button>
            </div>

            {/* Categories */}
            <div className="filter-group">
              <h4>Catégories</h4>
              <button
                className={`filter-chip ${!categoryId ? 'active' : ''}`}
                onClick={() => updateFilter('category', '')}
              >
                Tous
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`filter-chip ${categoryId == cat.id ? 'active' : ''}`}
                  onClick={() => updateFilter('category', cat.id)}
                >
                  {cat.nom}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="filter-group">
              <h4>Trier par</h4>
              <select className="select" value={sort} onChange={e => updateFilter('sort', e.target.value)}>
                <option value="recent">Plus récents</option>
                <option value="prix_asc">Prix croissant</option>
                <option value="prix_desc">Prix décroissant</option>
                <option value="nom">Nom A-Z</option>
              </select>
            </div>

            {(categoryId || search) && (
              <button className="btn btn-ghost btn-full" onClick={clearFilters} style={{ marginTop: 16 }}>
                <FiX /> Effacer les filtres
              </button>
            )}
          </aside>

          {/* Products Grid */}
          <main className="products-main">
            {loading ? (
              <div className="products-grid">
                {[1,2,3,4,5,6].map(i => (
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
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3>Aucun produit trouvé</h3>
                <p>Essayez de modifier vos critères de recherche</p>
              </div>
            ) : (
              <div className="products-grid">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
