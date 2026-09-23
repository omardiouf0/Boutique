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
  FiImage,
  FiDroplet,
  FiCheck,
  FiSliders,
  FiRotateCcw,
  FiEye,
  FiX
} from 'react-icons/fi';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';
import {
  CHARTE_PRESETS,
  RADIUS_PRESETS,
  deriveShadesFromHex,
  applyGraphicCharter
} from '../../utils/themeCharter';
import './SettingsPage.css';

export default function SettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingWave, setUploadingWave] = useState(false);
  const [uploadingOm, setUploadingOm] = useState(false);
  const [showCharterModal, setShowCharterModal] = useState(false);
  const [customColor, setCustomColor] = useState('#F68B1E');

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
    charte_theme: 'orange-jumia',
    primary_color: '#F68B1E',
    primary_dark: '#E07A10',
    primary_light: '#FFAD5C',
    primary_bg: '#FFF5EB',
    border_radius_theme: 'standard',
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/settings');
      setSettings(res.data);
      if (res.data?.primary_color) {
        setCustomColor(res.data.primary_color);
      }
      applyGraphicCharter(res.data);
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

  const handleSelectPreset = (preset) => {
    const updated = {
      ...settings,
      charte_theme: preset.id,
      primary_color: preset.primary,
      primary_dark: preset.primaryDark,
      primary_light: preset.primaryLight,
      primary_bg: preset.primaryBg,
    };
    setSettings(updated);
    setCustomColor(preset.primary);
    applyGraphicCharter(updated);
    toast.success(`Charte « ${preset.name} » appliquée !`);
  };

  const handleCustomColorChange = (colorHex) => {
    setCustomColor(colorHex);
    const shades = deriveShadesFromHex(colorHex);
    const updated = {
      ...settings,
      charte_theme: 'custom',
      primary_color: colorHex,
      primary_dark: shades.primaryDark,
      primary_light: shades.primaryLight,
      primary_bg: shades.primaryBg,
    };
    setSettings(updated);
    applyGraphicCharter(updated);
  };

  const handleRadiusChange = (radiusId) => {
    const updated = {
      ...settings,
      border_radius_theme: radiusId,
    };
    setSettings(updated);
    applyGraphicCharter(updated);
    toast.info('Style des bordures actualisé');
  };

  const handleResetCharter = () => {
    const defaultPreset = CHARTE_PRESETS[0];
    handleSelectPreset(defaultPreset);
    handleRadiusChange('standard');
    toast.success('Charte graphique Orange Bazar (défaut) restaurée !');
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
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/api/settings', settings);
      setSettings(res.data.settings);
      applyGraphicCharter(res.data.settings);
      toast.success('Paramètres et charte graphique enregistrés avec succès !');
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
          <p>Configurez les informations globales, livraisons, paiements mobiles, charte graphique et fonctionnalités</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-charte-trigger"
            onClick={() => setShowCharterModal(true)}
            title="Modifier les couleurs et l'ambiance visuelle du site"
          >
            <FiDroplet /> Changer la charte graphique
          </button>
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
          {/* SECTION DÉDIÉE: CHARTE GRAPHIQUE & IDENTITÉ VISUELLE */}
          <div className="settings-section-card card charte-section-full" id="charte-graphique">
            <div className="settings-section-header">
              <div className="settings-section-icon">
                <FiDroplet />
              </div>
              <div>
                <h3>Charte Graphique & Identité Visuelle</h3>
                <p>Personnalisez les couleurs officielles de votre marque, le style des boutons et des bordures</p>
              </div>
              <div className="charte-header-actions">
                <button
                  type="button"
                  className="btn btn-charte-trigger btn-sm"
                  onClick={() => setShowCharterModal(true)}
                >
                  <FiSliders /> Personnaliser en plein écran
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>
                🎨 Palettes officielles prédéfinies :
              </label>
              <div className="charte-presets-grid">
                {CHARTE_PRESETS.map((preset) => {
                  const isActive = (settings.charte_theme === preset.id) || (!settings.charte_theme && preset.id === 'orange-jumia');
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`charte-preset-card ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectPreset(preset)}
                    >
                      <div className="charte-card-top">
                        <div className="charte-color-disc" style={{ backgroundColor: preset.primary }}>
                          {isActive && <FiCheck />}
                        </div>
                        <span className="charte-badge">{preset.badge}</span>
                      </div>
                      <div className="charte-preset-info">
                        <strong>{preset.name}</strong>
                        <span>{preset.subtitle}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sélecteur de couleur personnalisée */}
            <div className="charte-custom-bar">
              <div className="charte-color-input-wrap">
                <label style={{ fontSize: 12.5, fontWeight: 700 }}>Couleur primaire personnalisée :</label>
                <input
                  type="color"
                  className="charte-color-picker"
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  title="Choisir une couleur sur le nuancier"
                />
                <input
                  type="text"
                  className="input charte-hex-input"
                  value={customColor}
                  maxLength={7}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('#') && val.length <= 7) {
                      setCustomColor(val);
                      if (val.length === 7) handleCustomColorChange(val);
                    }
                  }}
                  placeholder="#F68B1E"
                />
              </div>

              <div className="charte-shades-preview">
                <div className="charte-shade-pill">
                  <div className="charte-shade-dot" style={{ backgroundColor: settings.primary_color || customColor }} />
                  <span>Primaire</span>
                </div>
                <div className="charte-shade-pill">
                  <div className="charte-shade-dot" style={{ backgroundColor: settings.primary_dark || 'var(--primary-dark)' }} />
                  <span>Foncé</span>
                </div>
                <div className="charte-shade-pill">
                  <div className="charte-shade-dot" style={{ backgroundColor: settings.primary_light || 'var(--primary-light)' }} />
                  <span>Clair</span>
                </div>
                <div className="charte-shade-pill">
                  <div className="charte-shade-dot" style={{ backgroundColor: settings.primary_bg || 'var(--primary-bg)' }} />
                  <span>Fond</span>
                </div>
              </div>
            </div>

            {/* Style des bordures / radius */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                📐 Arrondi des cartes et boutons :
              </label>
              <div className="charte-radius-row">
                {RADIUS_PRESETS.map((rad) => (
                  <button
                    key={rad.id}
                    type="button"
                    className={`radius-option-btn ${(settings.border_radius_theme || 'standard') === rad.id ? 'active' : ''}`}
                    onClick={() => handleRadiusChange(rad.id)}
                  >
                    {rad.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Aperçu en direct */}
            <div className="charte-live-preview">
              <div className="charte-preview-header">
                <FiEye /> Aperçu instantané de la charte sur les composants clés
              </div>
              <div className="charte-preview-elements">
                <button type="button" className="charte-sample-btn">
                  🛒 Ajouter au panier
                </button>
                <div className="charte-sample-price">
                  <span>34 500</span>
                  <small style={{ fontSize: 13, fontWeight: 600 }}>{settings.devise}</small>
                </div>
                <span className="charte-sample-badge">
                  PROMO -25%
                </span>
                <span className="badge badge-success">
                  En stock (24)
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetCharter}
                  style={{ marginLeft: 'auto' }}
                  title="Réinitialiser"
                >
                  <FiRotateCcw /> Réinitialiser par défaut
                </button>
              </div>
            </div>
          </div>
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

      {/* MODAL COMPLET CHANGEMENT DE CHARTE GRAPHIQUE */}
      {showCharterModal && (
        <div className="charte-modal-overlay" onClick={() => setShowCharterModal(false)}>
          <div className="charte-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="charte-modal-header">
              <h2><FiDroplet style={{ color: 'var(--primary)' }} /> Modifier la Charte Graphique du Site</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowCharterModal(false)}
                title="Fermer"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="charte-modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 13.5 }}>
                Choisissez l'une des identités visuelles harmonieuses conçues pour la marketplace ou sélectionnez votre propre couleur. L'ensemble des boutons, liens, badges, bannières et prix s'ajustent instantanément.
              </p>

              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 10 }}>
                1. Sélectionner une palette de marque
              </label>
              <div className="charte-presets-grid">
                {CHARTE_PRESETS.map((preset) => {
                  const isActive = (settings.charte_theme === preset.id) || (!settings.charte_theme && preset.id === 'orange-jumia');
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`charte-preset-card ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectPreset(preset)}
                    >
                      <div className="charte-card-top">
                        <div className="charte-color-disc" style={{ backgroundColor: preset.primary }}>
                          {isActive && <FiCheck />}
                        </div>
                        <span className="charte-badge">{preset.badge}</span>
                      </div>
                      <div className="charte-preset-info">
                        <strong>{preset.name}</strong>
                        <span>{preset.subtitle}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginTop: 16, marginBottom: 10 }}>
                2. Ou choisir une couleur hexadécimale sur-mesure
              </label>
              <div className="charte-custom-bar">
                <div className="charte-color-input-wrap">
                  <input
                    type="color"
                    className="charte-color-picker"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                  />
                  <input
                    type="text"
                    className="input charte-hex-input"
                    value={customColor}
                    maxLength={7}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith('#') && val.length <= 7) {
                        setCustomColor(val);
                        if (val.length === 7) handleCustomColorChange(val);
                      }
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Cliquez sur le carré pour ouvrir la pipette ou tapez le code hexadécimal
                  </span>
                </div>
              </div>

              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginTop: 16, marginBottom: 8 }}>
                3. Style d'arrondi des coins
              </label>
              <div className="charte-radius-row">
                {RADIUS_PRESETS.map((rad) => (
                  <button
                    key={rad.id}
                    type="button"
                    className={`radius-option-btn ${(settings.border_radius_theme || 'standard') === rad.id ? 'active' : ''}`}
                    onClick={() => handleRadiusChange(rad.id)}
                  >
                    {rad.name}
                  </button>
                ))}
              </div>

              <div className="charte-live-preview" style={{ marginTop: 20 }}>
                <div className="charte-preview-header">
                  <FiEye /> Rendu en temps réel sur la boutique
                </div>
                <div className="charte-preview-elements">
                  <button type="button" className="charte-sample-btn">
                    🛒 Bouton d'action principal
                  </button>
                  <span className="charte-sample-badge">
                    Offre Spéciale -30%
                  </span>
                  <div className="charte-sample-price">
                    29 000 {settings.devise}
                  </div>
                </div>
              </div>
            </div>

            <div className="charte-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleResetCharter}
              >
                <FiRotateCcw /> Rétablir Orange Jumia
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCharterModal(false)}
                >
                  Fermer
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={(e) => {
                    handleSave(e);
                    setShowCharterModal(false);
                  }}
                  disabled={saving}
                >
                  <FiCheckCircle /> Enregistrer & Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
