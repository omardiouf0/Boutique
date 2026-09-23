import { useState, useEffect, useRef } from 'react';
import {
  FiSettings,
  FiSave,
  FiTruck,
  FiCreditCard,
  FiGlobe,
  FiCheckCircle,
  FiAlertTriangle,
  FiMessageSquare,
  FiBell,
  FiRefreshCw,
  FiUpload,
  FiTrash2,
  FiImage
} from 'react-icons/fi';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';
import './SettingsPage.css';

export default function SettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingWave, setUploadingWave] = useState(false);
  const [uploadingOm, setUploadingOm] = useState(false);

  const waveFileRef = useRef(null);
  const omFileRef = useRef(null);

  const [settings, setSettings] = useState({
    nom_site: 'BazarShop',
    slogan: '',
    email_contact: '',
    telephone_contact: '',
    adresse_physique: '',
    devise: 'FCFA',
    frais_livraison_dakar: 2000,
    frais_livraison_regions: 3500,
    livraison_gratuite_min: 50000,
    wave_active: true,
    orange_money_active: true,
    paiement_sur_place_active: true,
    wave_numero: '',
    orange_money_numero: '',
    wave_logo: '',
    orange_money_logo: '',
    banniere_annonce_active: true,
    banniere_annonce_texte: '',
    chatbot_actif: true,
    maintenance_mode: false,
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/settings');
      setSettings(res.data);
    } catch {
      toast.error('Impossible de charger les paramètres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is image
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image valide (PNG, JPG, SVG, WebP)');
      return;
    }

    const setUploading = type === 'wave' ? setUploadingWave : setUploadingOm;
    const logoKey = type === 'wave' ? 'wave_logo' : 'orange_money_logo';
    const inputRef = type === 'wave' ? waveFileRef : omFileRef;

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await api.post('/api/upload-image', fd);
      if (res.data?.url) {
        setSettings((prev) => ({ ...prev, [logoKey]: res.data.url }));
        toast.success(`Icône ${type === 'wave' ? 'Wave' : 'Orange Money'} téléversée avec succès !`);
      }
    } catch {
      toast.error(`Erreur lors du téléversement de l'icône ${type === 'wave' ? 'Wave' : 'Orange Money'}`);
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemoveIcon = (type) => {
    const logoKey = type === 'wave' ? 'wave_logo' : 'orange_money_logo';
    setSettings((prev) => ({ ...prev, [logoKey]: '' }));
    toast.info(`Icône personnalisée ${type === 'wave' ? 'Wave' : 'Orange Money'} retirée (l'icône par défaut sera utilisée)`);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/api/settings', settings);
      setSettings(res.data.settings);
      toast.success('Paramètres enregistrés avec succès !');
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erreur lors de l'enregistrement des paramètres");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div className="admin-page-header">
          <h1><FiSettings /> Paramètres du Site</h1>
        </div>
        <div className="settings-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card skeleton" style={{ height: 260 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page fade-in">
      <div className="settings-header">
        <div className="settings-header-title">
          <h1><FiSettings /> Paramétrage Général du Site</h1>
          <p>Configurez les informations globales, livraisons, paiements mobiles et fonctionnalités de la boutique</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchSettings}
            disabled={saving}
          >
            <FiRefreshCw /> Actualiser
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <FiRefreshCw className="spin" /> : <FiSave />}
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="settings-grid">
          {/* 1. INFORMATIONS GÉNÉRALES */}
          <div className="settings-section-card card">
            <div className="settings-section-header">
              <div className="settings-section-icon"><FiGlobe /></div>
              <div>
                <h3>Identité & Contact</h3>
                <p>Nom de la boutique, slogan et coordonnées officielles</p>
              </div>
            </div>

            <div className="settings-form-row">
              <label>Nom de la boutique</label>
              <input
                className="input"
                type="text"
                value={settings.nom_site}
                onChange={(e) => handleChange('nom_site', e.target.value)}
                required
              />
            </div>

            <div className="settings-form-row">
              <label>Slogan / Description courte</label>
              <input
                className="input"
                type="text"
                value={settings.slogan}
                onChange={(e) => handleChange('slogan', e.target.value)}
              />
            </div>

            <div className="settings-two-cols">
              <div className="settings-form-row">
                <label>Email de contact</label>
                <input
                  className="input"
                  type="email"
                  value={settings.email_contact}
                  onChange={(e) => handleChange('email_contact', e.target.value)}
                  required
                />
              </div>
              <div className="settings-form-row">
                <label>Téléphone / Support</label>
                <input
                  className="input"
                  type="text"
                  value={settings.telephone_contact}
                  onChange={(e) => handleChange('telephone_contact', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="settings-form-row">
              <label>Adresse physique du siège / showroom</label>
              <input
                className="input"
                type="text"
                value={settings.adresse_physique}
                onChange={(e) => handleChange('adresse_physique', e.target.value)}
              />
            </div>

            <div className="settings-form-row">
              <label>Devise monétaire principale</label>
              <input
                className="input"
                type="text"
                value={settings.devise}
                onChange={(e) => handleChange('devise', e.target.value)}
                required
              />
            </div>
          </div>

          {/* 2. LIVRAISONS & FRAIS */}
          <div className="settings-section-card card">
            <div className="settings-section-header">
              <div className="settings-section-icon"><FiTruck /></div>
              <div>
                <h3>Tarifs & Frais de Livraison</h3>
                <p>Définissez les zones tarifaires et seuils de gratuité</p>
              </div>
            </div>

            <div className="settings-form-row">
              <label>Frais de livraison Dakar (en FCFA)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="500"
                value={settings.frais_livraison_dakar}
                onChange={(e) => handleChange('frais_livraison_dakar', e.target.value)}
              />
            </div>

            <div className="settings-form-row">
              <label>Frais de livraison Autres Régions (en FCFA)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="500"
                value={settings.frais_livraison_regions}
                onChange={(e) => handleChange('frais_livraison_regions', e.target.value)}
              />
            </div>

            <div className="settings-form-row">
              <label>Seuil de livraison gratuite (en FCFA)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="1000"
                value={settings.livraison_gratuite_min}
                onChange={(e) => handleChange('livraison_gratuite_min', e.target.value)}
              />
            </div>

            <div className="settings-alert-box">
              <FiCheckCircle style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                Les commandes dont le total est supérieur ou égal à{' '}
                <strong>{new Intl.NumberFormat('fr-FR').format(settings.livraison_gratuite_min)} {settings.devise}</strong>{' '}
                bénéficient automatiquement des frais de port offerts.
              </div>
            </div>
          </div>

          {/* 3. MODES DE PAIEMENT & SÉCURITÉ */}
          <div className="settings-section-card card">
            <div className="settings-section-header">
              <div className="settings-section-icon"><FiCreditCard /></div>
              <div>
                <h3>Paiements Mobiles & Sécurité</h3>
                <p>Personnalisez les logos officiels, les numéros marchands et l'activation</p>
              </div>
            </div>

            {/* WAVE SÉNÉGAL */}
            <div className="settings-switch-row">
              <div className="settings-switch-label">
                <div className="payment-logo-preview" style={{ width: 36, height: 36 }}>
                  {settings.wave_logo ? (
                    <img src={settings.wave_logo} alt="Wave Logo" />
                  ) : (
                    <span className="payment-logo-emoji">🔵</span>
                  )}
                </div>
                <div className="settings-switch-texts">
                  <strong>Wave Sénégal</strong>
                  <span>Paiement par code QR ou transfert instantané</span>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.wave_active}
                  onChange={(e) => handleChange('wave_active', e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>

            {settings.wave_active && (
              <div style={{ padding: '0 8px 16px 8px', borderBottom: '1px dashed var(--border-color)', marginBottom: 16 }}>
                <div className="settings-form-row">
                  <label>Numéro de réception marchand Wave</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="+221 77 XXX XX XX"
                    value={settings.wave_numero}
                    onChange={(e) => handleChange('wave_numero', e.target.value)}
                  />
                </div>

                <div className="settings-form-row">
                  <label><FiImage /> Icône / Logo personnalisé Wave</label>
                  <div className="payment-logo-uploader">
                    <div className="payment-logo-preview">
                      {settings.wave_logo ? (
                        <img src={settings.wave_logo} alt="Wave Logo" />
                      ) : (
                        <span className="payment-logo-emoji">🔵</span>
                      )}
                    </div>
                    <div className="payment-logo-actions">
                      <div className="payment-logo-btn-wrap">
                        <input
                          type="file"
                          ref={waveFileRef}
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileUpload(e, 'wave')}
                        />
                        <button
                          type="button"
                          className="payment-upload-btn"
                          onClick={() => waveFileRef.current?.click()}
                          disabled={uploadingWave}
                        >
                          {uploadingWave ? <FiRefreshCw className="spin" /> : <FiUpload />}
                          {uploadingWave ? 'Téléversement...' : 'Téléverser une icône Wave'}
                        </button>
                        {settings.wave_logo && (
                          <button
                            type="button"
                            className="payment-remove-btn"
                            onClick={() => handleRemoveIcon('wave')}
                          >
                            <FiTrash2 /> Retirer
                          </button>
                        )}
                      </div>
                      <p className="payment-logo-hint">Format recommandé : PNG transparent ou SVG (carré 128x128 ou 256x256)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ORANGE MONEY SÉNÉGAL */}
            <div className="settings-switch-row">
              <div className="settings-switch-label">
                <div className="payment-logo-preview" style={{ width: 36, height: 36 }}>
                  {settings.orange_money_logo ? (
                    <img src={settings.orange_money_logo} alt="Orange Money Logo" />
                  ) : (
                    <span className="payment-logo-emoji">🟠</span>
                  )}
                </div>
                <div className="settings-switch-texts">
                  <strong>Orange Money Sénégal</strong>
                  <span>Paiement marchand sécurisé OM</span>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.orange_money_active}
                  onChange={(e) => handleChange('orange_money_active', e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>

            {settings.orange_money_active && (
              <div style={{ padding: '0 8px 16px 8px', borderBottom: '1px dashed var(--border-color)', marginBottom: 16 }}>
                <div className="settings-form-row">
                  <label>Numéro de réception marchand Orange Money</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="+221 78 XXX XX XX"
                    value={settings.orange_money_numero}
                    onChange={(e) => handleChange('orange_money_numero', e.target.value)}
                  />
                </div>

                <div className="settings-form-row">
                  <label><FiImage /> Icône / Logo personnalisé Orange Money</label>
                  <div className="payment-logo-uploader">
                    <div className="payment-logo-preview">
                      {settings.orange_money_logo ? (
                        <img src={settings.orange_money_logo} alt="Orange Money Logo" />
                      ) : (
                        <span className="payment-logo-emoji">🟠</span>
                      )}
                    </div>
                    <div className="payment-logo-actions">
                      <div className="payment-logo-btn-wrap">
                        <input
                          type="file"
                          ref={omFileRef}
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileUpload(e, 'om')}
                        />
                        <button
                          type="button"
                          className="payment-upload-btn"
                          onClick={() => omFileRef.current?.click()}
                          disabled={uploadingOm}
                        >
                          {uploadingOm ? <FiRefreshCw className="spin" /> : <FiUpload />}
                          {uploadingOm ? 'Téléversement...' : 'Téléverser une icône OM'}
                        </button>
                        {settings.orange_money_logo && (
                          <button
                            type="button"
                            className="payment-remove-btn"
                            onClick={() => handleRemoveIcon('om')}
                          >
                            <FiTrash2 /> Retirer
                          </button>
                        )}
                      </div>
                      <p className="payment-logo-hint">Format recommandé : PNG transparent ou SVG (carré 128x128 ou 256x256)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAIEMENT SUR PLACE */}
            <div className="settings-switch-row">
              <div className="settings-switch-label">
                <div className="payment-logo-preview" style={{ width: 36, height: 36 }}>
                  <span className="payment-logo-emoji">💵</span>
                </div>
                <div className="settings-switch-texts">
                  <strong>Paiement à la livraison (Sur place)</strong>
                  <span>Paiement en espèces lors de la réception du colis</span>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.paiement_sur_place_active}
                  onChange={(e) => handleChange('paiement_sur_place_active', e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>
          </div>

          {/* 4. BANNIÈRE PROMO & OPTIONS AVANCÉES */}
          <div className="settings-section-card card">
            <div className="settings-section-header">
              <div className="settings-section-icon"><FiBell /></div>
              <div>
                <h3>Annonces & Fonctionnalités</h3>
                <p>Bannière du haut, Assistant IA et mode maintenance</p>
              </div>
            </div>

            <div className="settings-switch-row">
              <div className="settings-switch-label">
                <div className="settings-switch-texts">
                  <strong>Bannière d'annonce en haut du site</strong>
                  <span>Afficher un message promo ou d'information générale</span>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.banniere_annonce_active}
                  onChange={(e) => handleChange('banniere_annonce_active', e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>

            {settings.banniere_annonce_active && (
              <div className="settings-form-row" style={{ paddingLeft: 8 }}>
                <label>Texte de la bannière promo</label>
                <textarea
                  className="input"
                  rows={2}
                  value={settings.banniere_annonce_texte}
                  onChange={(e) => handleChange('banniere_annonce_texte', e.target.value)}
                />
              </div>
            )}

            <div className="settings-switch-row">
              <div className="settings-switch-label">
                <div className="settings-switch-texts">
                  <strong><FiMessageSquare style={{ display: 'inline', marginRight: 4 }} /> Assistant Intelligent Gemini</strong>
                  <span>Afficher le bouton de chat IA pour assister les clients</span>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.chatbot_actif}
                  onChange={(e) => handleChange('chatbot_actif', e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="settings-switch-row" style={{ borderColor: settings.maintenance_mode ? '#EF4444' : undefined }}>
              <div className="settings-switch-label">
                <div className="settings-switch-texts">
                  <strong style={{ color: settings.maintenance_mode ? '#EF4444' : undefined }}>
                    <FiAlertTriangle style={{ display: 'inline', marginRight: 4 }} /> Mode Maintenance
                  </strong>
                  <span>Afficher une page temporaire de maintenance pour les visiteurs</span>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode}
                  onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? <FiRefreshCw className="spin" /> : <FiSave />}
            {saving ? 'Enregistrement des paramètres...' : 'Enregistrer tous les paramètres'}
          </button>
        </div>
      </form>
    </div>
  );
}
