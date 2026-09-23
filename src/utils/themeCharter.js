// ══════════════════════════════════════════════════════════════════
// BAZARSHOP — GESTION DE LA CHARTE GRAPHIQUE (VISUAL THEME ENGINE)
// ══════════════════════════════════════════════════════════════════

export const CHARTE_PRESETS = [
  {
    id: 'orange-jumia',
    name: 'Orange Bazar (Jumia)',
    subtitle: 'Identité historique & vibrante',
    primary: '#F68B1E',
    primaryDark: '#E07A10',
    primaryLight: '#FFAD5C',
    primaryBg: '#FFF5EB',
    badge: 'Standard',
  },
  {
    id: 'bleu-royal',
    name: 'Bleu Royal & Tech',
    subtitle: 'Confiance & haute technologie',
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    primaryLight: '#60A5FA',
    primaryBg: '#EFF6FF',
    badge: 'Recommandé',
  },
  {
    id: 'vert-emeraude',
    name: 'Vert Émeraude & Nature',
    subtitle: 'Fraîcheur, santé & produits bio',
    primary: '#059669',
    primaryDark: '#047857',
    primaryLight: '#34D399',
    primaryBg: '#ECFDF5',
    badge: 'Éco / Bio',
  },
  {
    id: 'rouge-rubis',
    name: 'Rouge Rubis & Promo',
    subtitle: 'Dynamique d\'offres & déstockage',
    primary: '#E11D48',
    primaryDark: '#BE123C',
    primaryLight: '#FB7185',
    primaryBg: '#FFF1F2',
    badge: 'Offres Flash',
  },
  {
    id: 'violet-luxe',
    name: 'Violet Élégance & Luxe',
    subtitle: 'Prestige, mode & cosmétique premium',
    primary: '#7C3AED',
    primaryDark: '#6D28D9',
    primaryLight: '#A78BFA',
    primaryBg: '#F5F3FF',
    badge: 'Prestige',
  },
  {
    id: 'ambre-or',
    name: 'Or & Ambre Impérial',
    subtitle: 'Raffiné, chaleureux & exclusif',
    primary: '#D97706',
    primaryDark: '#B45309',
    primaryLight: '#FBBF24',
    primaryBg: '#FEF3C7',
    badge: 'Exclusif',
  },
  {
    id: 'cyan-ocean',
    name: 'Cyan Océan',
    subtitle: 'Épuré, moderne & rafraîchissant',
    primary: '#0284C7',
    primaryDark: '#0369A1',
    primaryLight: '#38BDF8',
    primaryBg: '#F0F9FF',
    badge: 'Tech Fresh',
  },
];

export const RADIUS_PRESETS = [
  { id: 'minimal', name: 'Épuré & Rectangulaire (Minimaliste)', sm: '2px', md: '4px', lg: '8px', xl: '12px' },
  { id: 'standard', name: 'Équilibré (Standard BazarShop)', sm: '6px', md: '10px', lg: '16px', xl: '20px' },
  { id: 'rounded', name: 'Doux & Très Arrondi (Moderne)', sm: '10px', md: '16px', lg: '24px', xl: '32px' },
];

/**
 * Convert hex color to rgb components
 */
function hexToRgb(hex) {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Adjust color brightness
 */
function adjustBrightness(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (val) => Math.min(255, Math.max(0, Math.round(val)));
  const factor = percent / 100;
  
  let newR, newG, newB;
  if (percent > 0) {
    newR = clamp(r + (255 - r) * factor);
    newG = clamp(g + (255 - g) * factor);
    newB = clamp(b + (255 - b) * factor);
  } else {
    const mult = 1 + factor;
    newR = clamp(r * mult);
    newG = clamp(g * mult);
    newB = clamp(b * mult);
  }

  const toHex = (c) => c.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Derive full theme shades from any primary hex
 */
export function deriveShadesFromHex(primaryHex) {
  try {
    const { r, g, b } = hexToRgb(primaryHex);
    const primaryDark = adjustBrightness(primaryHex, -18);
    const primaryLight = adjustBrightness(primaryHex, 25);
    // very light tinted background
    const primaryBg = `rgba(${r}, ${g}, ${b}, 0.08)`;
    const shadowGlow = `0 0 20px rgba(${r}, ${g}, ${b}, 0.28)`;

    return {
      primary: primaryHex,
      primaryDark,
      primaryLight,
      primaryBg,
      shadowGlow,
    };
  } catch {
    return {
      primary: '#F68B1E',
      primaryDark: '#E07A10',
      primaryLight: '#FFAD5C',
      primaryBg: '#FFF5EB',
      shadowGlow: '0 0 20px rgba(246, 139, 30, 0.25)',
    };
  }
}

/**
 * Apply the graphic charter to the document root
 */
export function applyGraphicCharter(config = {}) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  let primary = config.primary_color || config.primary || '#F68B1E';
  let primaryDark = config.primary_dark || config.primaryDark;
  let primaryLight = config.primary_light || config.primaryLight;
  let primaryBg = config.primary_bg || config.primaryBg;

  // Auto calculate shades if missing
  if (!primaryDark || !primaryLight || !primaryBg) {
    const derived = deriveShadesFromHex(primary);
    primaryDark = derived.primaryDark;
    primaryLight = derived.primaryLight;
    primaryBg = derived.primaryBg;
  }

  root.style.setProperty('--primary', primary);
  root.style.setProperty('--primary-dark', primaryDark);
  root.style.setProperty('--primary-light', primaryLight);
  root.style.setProperty('--primary-bg', primaryBg);

  try {
    const { r, g, b } = hexToRgb(primary);
    root.style.setProperty('--shadow-glow', `0 0 20px rgba(${r}, ${g}, ${b}, 0.25)`);
  } catch {
    root.style.setProperty('--shadow-glow', `0 0 20px rgba(246, 139, 30, 0.25)`);
  }

  // Border radius preset
  const radiusId = config.border_radius_theme || 'standard';
  const radiusPreset = RADIUS_PRESETS.find(p => p.id === radiusId) || RADIUS_PRESETS[1];
  root.style.setProperty('--radius-sm', radiusPreset.sm);
  root.style.setProperty('--radius-md', radiusPreset.md);
  root.style.setProperty('--radius-lg', radiusPreset.lg);
  root.style.setProperty('--radius-xl', radiusPreset.xl);

  // Cache in localStorage for immediate sync across views
  const charterData = {
    charte_theme: config.charte_theme || 'custom',
    primary_color: primary,
    primary_dark: primaryDark,
    primary_light: primaryLight,
    primary_bg: primaryBg,
    border_radius_theme: radiusId,
  };
  localStorage.setItem('bazarshop_charter', JSON.stringify(charterData));

  // Dispatch custom event for real-time reactivity
  window.dispatchEvent(new CustomEvent('charter-changed', { detail: charterData }));
}

/**
 * Retrieve saved graphic charter
 */
export function getSavedGraphicCharter() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem('bazarshop_charter');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
