import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiPhone, FiMapPin, FiCreditCard, FiCheck, FiDownload } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api, { API_URL } from '../api/axios';
import './CheckoutPage.css';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart, getItemPrice } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [settings, setSettings] = useState(null);

  const [form, setForm] = useState({
    nom_client: user?.nom || '',
    telephone: user?.telephone || '',
    adresse: '',
    methode: 'orange_money',
    tel_paiement: user?.telephone || '',
  });

  useEffect(() => {
    api.get('/api/settings')
      .then((res) => {
        setSettings(res.data);
        if (res.data) {
          if (!res.data.orange_money_active && res.data.wave_active) {
            setForm((f) => ({ ...f, methode: 'wave' }));
          } else if (!res.data.orange_money_active && !res.data.wave_active && res.data.paiement_sur_place_active) {
            setForm((f) => ({ ...f, methode: 'sur_place' }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const formatPrice = (price) => new Intl.NumberFormat('fr-FR').format(price);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '80px 16px', textAlign: 'center' }}>
        <div className="empty-state">
          <div className="empty-state-icon">🔐</div>
          <h3>Connectez-vous pour commander</h3>
          <p>Vous devez être connecté pour passer une commande.</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: 16 }}>Se connecter</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !orderResult) {
    return (
      <div className="container" style={{ padding: '80px 16px', textAlign: 'center' }}>
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <h3>Votre panier est vide</h3>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>Explorer les produits</Link>
        </div>
      </div>
    );
  }

  const handleSubmitOrder = async () => {
    if (!form.nom_client || !form.telephone) {
      toast.error('Veuillez remplir votre nom et téléphone');
      return;
    }

    setLoading(true);
    try {
      // Create order
      const orderRes = await api.post('/api/orders/', {
        items: items.map(item => ({ product_id: item.id, quantite: item.quantity })),
        nom_client: form.nom_client,
        telephone: form.telephone,
        adresse: form.adresse,
      });

      // Process payment
      const paymentRes = await api.post('/api/payments/', {
        order_id: orderRes.data.id,
        methode: form.methode,
        telephone: form.methode !== 'sur_place' ? form.tel_paiement : null,
      });

      setOrderResult({
        order: orderRes.data,
        payment: paymentRes.data,
      });
      setStep(4);
      clearCart();
      toast.success('Commande passée avec succès ! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la commande');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    if (orderResult) {
      window.open(`${API_URL}/api/receipts/${orderResult.order.id}?token=${localStorage.getItem('token')}`, '_blank');
    }
  };

  return (
    <div className="checkout-page fade-in">
      <div className="container">
        <Link to="/products" className="back-link"><FiArrowLeft /> Continuer les achats</Link>

        {/* Steps */}
        <div className="checkout-steps">
          {[
            { num: 1, label: 'Livraison' },
            { num: 2, label: 'Paiement' },
            { num: 3, label: 'Confirmation' },
            { num: 4, label: 'Reçu' },
          ].map(s => (
            <div key={s.num} className={`checkout-step ${step >= s.num ? 'active' : ''} ${step > s.num ? 'done' : ''}`}>
              <div className="step-circle">{step > s.num ? <FiCheck /> : s.num}</div>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="checkout-grid">
          {/* Left: Forms */}
          <div className="checkout-main">
            {/* Step 1: Shipping */}
            {step === 1 && (
              <div className="checkout-section card slide-up">
                <h2><FiUser /> Informations de livraison</h2>
                <div className="checkout-form">
                  <div className="input-group">
                    <label>Nom complet *</label>
                    <input className="input" value={form.nom_client} onChange={e => updateForm('nom_client', e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label><FiPhone /> Téléphone *</label>
                    <input className="input" type="tel" placeholder="+221 7X XXX XX XX" value={form.telephone} onChange={e => updateForm('telephone', e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label><FiMapPin /> Adresse de livraison</label>
                    <textarea className="textarea" placeholder="Quartier, rue, repère..." value={form.adresse} onChange={e => updateForm('adresse', e.target.value)} />
                  </div>
                  <button className="btn btn-primary btn-lg btn-full" onClick={() => {
                    if (!form.nom_client || !form.telephone) {
                      toast.error('Veuillez remplir les champs obligatoires');
                      return;
                    }
                    setStep(2);
                  }}>
                    Continuer vers le paiement
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <div className="checkout-section card slide-up">
                <h2><FiCreditCard /> Mode de paiement</h2>
                <div className="payment-methods">
                  {[
                    {
                      value: 'orange_money',
                      label: 'Orange Money',
                      icon: settings?.orange_money_logo ? (
                        <img src={settings.orange_money_logo} alt="Orange Money" />
                      ) : (
                        '🟠'
                      ),
                      desc: 'Payez depuis votre compte Orange Money',
                      enabled: settings ? settings.orange_money_active : true,
                    },
                    {
                      value: 'wave',
                      label: 'Wave',
                      icon: settings?.wave_logo ? (
                        <img src={settings.wave_logo} alt="Wave" />
                      ) : (
                        '🔵'
                      ),
                      desc: 'Payez depuis votre compte Wave',
                      enabled: settings ? settings.wave_active : true,
                    },
                    {
                      value: 'sur_place',
                      label: 'Paiement sur place',
                      icon: '💵',
                      desc: 'Payez à la livraison en espèces',
                      enabled: settings ? settings.paiement_sur_place_active : true,
                    },
                  ]
                    .filter(m => m.enabled)
                    .map(method => (
                    <label key={method.value} className={`payment-option ${form.methode === method.value ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="payment"
                        value={method.value}
                        checked={form.methode === method.value}
                        onChange={e => updateForm('methode', e.target.value)}
                      />
                      <span className="payment-option-icon">{method.icon}</span>
                      <div>
                        <strong>{method.label}</strong>
                        <p>{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {form.methode !== 'sur_place' && (
                  <div className="input-group" style={{ marginTop: 16 }}>
                    <label><FiPhone /> Numéro {form.methode === 'orange_money' ? 'Orange Money' : 'Wave'}</label>
                    <input
                      className="input"
                      type="tel"
                      placeholder="+221 7X XXX XX XX"
                      value={form.tel_paiement}
                      onChange={e => updateForm('tel_paiement', e.target.value)}
                    />
                  </div>
                )}

                <div className="checkout-nav">
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>← Retour</button>
                  <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>Vérifier la commande</button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="checkout-section card slide-up">
                <h2>📋 Récapitulatif de la commande</h2>

                <div className="confirm-section">
                  <h4>Livraison</h4>
                  <p><strong>{form.nom_client}</strong></p>
                  <p>{form.telephone}</p>
                  {form.adresse && <p>{form.adresse}</p>}
                </div>

                <div className="confirm-section">
                  <h4>Paiement</h4>
                  <p>{form.methode === 'orange_money' ? '🟠 Orange Money' : form.methode === 'wave' ? '🔵 Wave' : '💵 Sur Place'}</p>
                  {form.methode !== 'sur_place' && <p>{form.tel_paiement}</p>}
                </div>

                <div className="confirm-section">
                  <h4>Articles ({items.length})</h4>
                  {items.map(item => (
                    <div key={item.id} className="confirm-item">
                      <span>{item.nom} × {item.quantity}</span>
                      <span className="price">{formatPrice(getItemPrice(item) * item.quantity)} FCFA</span>
                    </div>
                  ))}
                </div>

                <div className="confirm-total">
                  <span>Total à payer</span>
                  <span className="price price-promo">{formatPrice(totalPrice)} FCFA</span>
                </div>

                <div className="checkout-nav">
                  <button className="btn btn-secondary" onClick={() => setStep(2)}>← Modifier</button>
                  <button className="btn btn-primary btn-lg" onClick={handleSubmitOrder} disabled={loading}>
                    {loading ? 'Traitement...' : '✓ Confirmer la commande'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Receipt */}
            {step === 4 && orderResult && (
              <div className="checkout-section card slide-up" style={{ textAlign: 'center' }}>
                <div className="order-success">
                  <div className="success-icon">✅</div>
                  <h2>Commande confirmée !</h2>
                  <p>Votre commande <strong>#{orderResult.order.id}</strong> a été enregistrée.</p>
                  <p className="success-ref">
                    Référence paiement : <code>{orderResult.payment.reference}</code>
                  </p>

                  <div className="success-actions">
                    <button className="btn btn-primary btn-lg" onClick={downloadReceipt}>
                      <FiDownload /> Télécharger le reçu PDF
                    </button>
                    <Link to="/orders" className="btn btn-secondary">Voir mes commandes</Link>
                    <Link to="/products" className="btn btn-ghost">Continuer les achats</Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Order Summary */}
          {step < 4 && (
            <aside className="checkout-summary card">
              <h3>Résumé de la commande</h3>
              <div className="summary-items">
                {items.map(item => (
                  <div key={item.id} className="summary-item">
                    <img src={item.image_url || 'https://via.placeholder.com/60'} alt={item.nom} />
                    <div>
                      <p className="summary-item-name">{item.nom}</p>
                      <p className="summary-item-qty">Qté: {item.quantity}</p>
                    </div>
                    <span className="price">{formatPrice(getItemPrice(item) * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="summary-divider" />
              <div className="summary-total">
                <span>Total</span>
                <span className="price price-promo">{formatPrice(totalPrice)} FCFA</span>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
