import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const portArgIndex = process.argv.indexOf('--port');
const portArg = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? process.argv[portArgIndex + 1] : null;
const PORT = process.env.PORT || portArg || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'bazarshop-secret-key-change-in-production';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`);
  },
});
const upload = multer({ storage });

// In-memory data store initialized with demo data
interface User {
  id: number;
  nom: string;
  email: string;
  password_hash: string;
  telephone?: string;
  role: 'admin' | 'client';
  created_at: string;
}

interface Category {
  id: number;
  nom: string;
  description?: string;
  image_url?: string;
  slug: string;
  created_at: string;
}

interface Product {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  prix_promo?: number | null;
  stock: number;
  image_url?: string;
  category_id: number;
  is_active: boolean;
  created_at: string;
  category?: Category;
}

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantite: number;
  prix_unitaire: number;
  product?: Product;
}

interface Payment {
  id: number;
  order_id: number;
  methode: string;
  statut: 'en_attente' | 'completee' | 'echouee';
  reference?: string;
  montant: number;
  telephone?: string;
  created_at: string;
}

interface Order {
  id: number;
  user_id: number;
  total: number;
  statut: 'en_attente' | 'confirmee' | 'en_livraison' | 'livree' | 'annulee';
  nom_client?: string;
  telephone?: string;
  adresse?: string;
  created_at: string;
  items: OrderItem[];
  payment?: Payment | null;
}

interface SiteSettings {
  nom_site: string;
  slogan: string;
  email_contact: string;
  telephone_contact: string;
  adresse_physique: string;
  devise: string;
  frais_livraison_dakar: number;
  frais_livraison_regions: number;
  livraison_gratuite_min: number;
  wave_active: boolean;
  orange_money_active: boolean;
  paiement_sur_place_active: boolean;
  wave_numero: string;
  orange_money_numero: string;
  wave_logo?: string;
  orange_money_logo?: string;
  banniere_annonce_active: boolean;
  banniere_annonce_texte: string;
  chatbot_actif: boolean;
  maintenance_mode: boolean;
  charte_theme?: string;
  primary_color?: string;
  primary_dark?: string;
  primary_light?: string;
  primary_bg?: string;
  border_radius_theme?: string;
  image_entete?: string;
}

const defaultSiteSettings: SiteSettings = {
  nom_site: 'Ndiaye Shop',
  slogan: 'Votre marketplace de confiance au Sénégal',
  email_contact: 'contact@ndiayeshop.com',
  telephone_contact: '+221 33 800 00 00',
  adresse_physique: 'Plateau, Rue Carnot x Dial Diop, Dakar, Sénégal',
  devise: 'FCFA',
  frais_livraison_dakar: 2000,
  frais_livraison_regions: 3500,
  livraison_gratuite_min: 50000,
  wave_active: true,
  orange_money_active: true,
  paiement_sur_place_active: true,
  wave_numero: '+221 77 123 45 67',
  orange_money_numero: '+221 78 987 65 43',
  wave_logo: '',
  orange_money_logo: '',
  banniere_annonce_active: true,
  banniere_annonce_texte: '🎉 Livraison gratuite à Dakar dès 50 000 FCFA d\'achat avec le code BAZAR2026 !',
  chatbot_actif: true,
  maintenance_mode: false,
  charte_theme: 'orange-jumia',
  primary_color: '#F68B1E',
  primary_dark: '#E07A10',
  primary_light: '#FFAD5C',
  primary_bg: '#FFF5EB',
  border_radius_theme: 'standard',
  image_entete: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
};

const SETTINGS_FILE = path.resolve('data/settings.json');
const dataDir = path.resolve('data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let siteSettings: SiteSettings = { ...defaultSiteSettings };
if (fs.existsSync(SETTINGS_FILE)) {
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    siteSettings = { ...defaultSiteSettings, ...JSON.parse(raw) };
  } catch {
    // keep defaults
  }
}

// Initial seed
let nextUserId = 2;
let nextCategoryId = 7;
let nextProductId = 18;
let nextOrderId = 1;
let nextOrderItemId = 1;
let nextPaymentId = 1;

const users: User[] = [
  {
    id: 1,
    nom: 'Administrateur',
    email: 'admin@bazarshop.com',
    password_hash: 'admin123', // Demo plain check / token
    telephone: '+221770000000',
    role: 'admin',
    created_at: new Date().toISOString(),
  },
];

const categories: Category[] = [
  { id: 1, nom: 'Électronique', description: 'Smartphones, tablettes, ordinateurs et accessoires', slug: 'electronique', image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', created_at: new Date().toISOString() },
  { id: 2, nom: 'Mode Homme', description: 'Vêtements, chaussures et accessoires pour homme', slug: 'mode-homme', image_url: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=400', created_at: new Date().toISOString() },
  { id: 3, nom: 'Mode Femme', description: 'Vêtements, chaussures et accessoires pour femme', slug: 'mode-femme', image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400', created_at: new Date().toISOString() },
  { id: 4, nom: 'Maison & Cuisine', description: 'Meubles, décoration et ustensiles de cuisine', slug: 'maison-cuisine', image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', created_at: new Date().toISOString() },
  { id: 5, nom: 'Beauté & Santé', description: 'Cosmétiques, soins et produits de santé', slug: 'beaute-sante', image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', created_at: new Date().toISOString() },
  { id: 6, nom: 'Sports & Loisirs', description: 'Équipements sportifs et articles de loisirs', slug: 'sports-loisirs', image_url: 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=400', created_at: new Date().toISOString() },
];

const products: Product[] = [
  { id: 1, nom: 'iPhone 15 Pro Max', description: 'Apple iPhone 15 Pro Max 256GB, écran Super Retina XDR 6.7 pouces', prix: 850000, prix_promo: 799000, stock: 15, category_id: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', created_at: new Date().toISOString() },
  { id: 2, nom: 'Samsung Galaxy S24 Ultra', description: 'Samsung Galaxy S24 Ultra 256GB, S Pen intégré, écran 6.8 pouces', prix: 780000, prix_promo: 725000, stock: 20, category_id: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400', created_at: new Date().toISOString() },
  { id: 3, nom: 'MacBook Air M3', description: 'Apple MacBook Air 15 pouces avec puce M3, 8GB RAM, 256GB SSD', prix: 950000, prix_promo: null, stock: 8, category_id: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', created_at: new Date().toISOString() },
  { id: 4, nom: 'Écouteurs AirPods Pro 2', description: 'Apple AirPods Pro 2e génération avec boîtier de charge MagSafe', prix: 175000, prix_promo: 155000, stock: 30, category_id: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400', created_at: new Date().toISOString() },
  { id: 5, nom: 'Tablette iPad Air', description: 'Apple iPad Air 11 pouces, puce M2, 128GB', prix: 450000, prix_promo: null, stock: 12, category_id: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400', created_at: new Date().toISOString() },
  { id: 6, nom: 'Polo Ralph Lauren Classic', description: 'Polo classique en coton piqué, coupe régulière, logo brodé', prix: 45000, prix_promo: 35000, stock: 50, category_id: 2, is_active: true, image_url: 'https://images.unsplash.com/photo-1625910513413-5fc69d80b91a?w=400', created_at: new Date().toISOString() },
  { id: 7, nom: "Jean Slim Levi's 511", description: 'Jean slim fit en denim stretch, coloris bleu indigo', prix: 38000, prix_promo: null, stock: 35, category_id: 2, is_active: true, image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', created_at: new Date().toISOString() },
  { id: 8, nom: 'Sneakers Nike Air Max', description: "Nike Air Max 90 Essential, coussin d'air visible, confort optimal", prix: 75000, prix_promo: 65000, stock: 25, category_id: 2, is_active: true, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', created_at: new Date().toISOString() },
  { id: 9, nom: 'Robe Élégante Satin', description: 'Robe longue en satin avec bretelles fines, idéale pour les soirées', prix: 55000, prix_promo: 42000, stock: 20, category_id: 3, is_active: true, image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', created_at: new Date().toISOString() },
  { id: 10, nom: 'Sac à Main Cuir', description: 'Sac à main en cuir véritable, compartiments multiples, bandoulière amovible', prix: 65000, prix_promo: null, stock: 18, category_id: 3, is_active: true, image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400', created_at: new Date().toISOString() },
  { id: 11, nom: 'Sandales à Talons', description: 'Sandales élégantes à talons hauts, brides croisées', prix: 35000, prix_promo: 28000, stock: 22, category_id: 3, is_active: true, image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400', created_at: new Date().toISOString() },
  { id: 12, nom: 'Robot Mixeur Multifonction', description: 'Robot de cuisine 1000W, 10 vitesses, bol 4.5L, lames inox', prix: 85000, prix_promo: 72000, stock: 15, category_id: 4, is_active: true, image_url: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400', created_at: new Date().toISOString() },
  { id: 13, nom: 'Set de Casseroles Premium', description: 'Ensemble 5 pièces en acier inoxydable, fond thermique', prix: 95000, prix_promo: null, stock: 10, category_id: 4, is_active: true, image_url: 'https://images.unsplash.com/photo-1584990347449-a6330c1c5e6b?w=400', created_at: new Date().toISOString() },
  { id: 14, nom: 'Coffret Parfum Dior', description: "Coffret J'adore Dior: eau de parfum 50ml + lait corps 75ml", prix: 120000, prix_promo: 99000, stock: 25, category_id: 5, is_active: true, image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400', created_at: new Date().toISOString() },
  { id: 15, nom: 'Crème Hydratante Nivea', description: 'Crème hydratante visage et corps, pot 400ml', prix: 8500, prix_promo: null, stock: 100, category_id: 5, is_active: true, image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', created_at: new Date().toISOString() },
  { id: 16, nom: 'Ballon de Football Adidas', description: 'Ballon officiel Adidas Al Rihla, taille 5, cousu main', prix: 25000, prix_promo: 19500, stock: 40, category_id: 6, is_active: true, image_url: 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=400', created_at: new Date().toISOString() },
  { id: 17, nom: 'Tapis de Yoga Premium', description: 'Tapis antidérapant 6mm, matériaux écologiques, avec sangle', prix: 18000, prix_promo: null, stock: 30, category_id: 6, is_active: true, image_url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400', created_at: new Date().toISOString() },
];

const orders: Order[] = [];
const payments: Payment[] = [];

// Helper functions
function getProductWithCategory(p: Product): Product {
  const cat = categories.find((c) => c.id === p.category_id);
  return { ...p, category: cat };
}

function getUserOut(u: User) {
  return {
    id: u.id,
    nom: u.nom,
    email: u.email,
    telephone: u.telephone || null,
    role: u.role,
    created_at: u.created_at,
  };
}

function createToken(userId: number) {
  return jwt.sign({ sub: userId }, SECRET_KEY, { expiresIn: '7d' });
}

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.slice(7) : (req.query.token as string);

  if (!token) {
    return res.status(401).json({ detail: 'Non authentifié' });
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY) as { sub: number };
    const user = users.find((u) => u.id === Number(payload.sub));
    if (!user) {
      return res.status(401).json({ detail: 'Utilisateur non trouvé' });
    }
    (req as any).user = user;
    next();
  } catch {
    return res.status(401).json({ detail: 'Token invalide ou expiré' });
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  authenticateToken(req, res, () => {
    const user = (req as any).user as User;
    if (user.role !== 'admin') {
      return res.status(403).json({ detail: 'Accès réservé aux administrateurs' });
    }
    next();
  });
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-');
}

// ─── AUTH ROUTER ─────────────────────────────────────────────────────────────
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { nom, email, password, telephone } = req.body;
  if (!nom || !email || !password) {
    return res.status(400).json({ detail: 'Veuillez remplir tous les champs obligatoires' });
  }

  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ detail: 'Cet email est déjà utilisé' });
  }

  const newUser: User = {
    id: nextUserId++,
    nom,
    email: email.toLowerCase(),
    password_hash: password,
    telephone: telephone || '',
    role: 'client',
    created_at: new Date().toISOString(),
  };
  users.push(newUser);

  const token = createToken(newUser.id);
  return res.status(200).json({
    access_token: token,
    token_type: 'bearer',
    user: getUserOut(newUser),
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email et mot de passe requis' });
  }

  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password_hash !== password) {
    return res.status(401).json({ detail: 'Email ou mot de passe incorrect' });
  }

  const token = createToken(user.id);
  return res.status(200).json({
    access_token: token,
    token_type: 'bearer',
    user: getUserOut(user),
  });
});

app.get('/api/auth/me', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  return res.json(getUserOut(user));
});

// ─── CATEGORIES ROUTER ─────────────────────────────────────────────────────────
app.get('/api/categories', (_req: Request, res: Response) => {
  const sorted = [...categories].sort((a, b) => a.nom.localeCompare(b.nom));
  return res.json(sorted);
});

app.get('/api/categories/:id', (req: Request, res: Response) => {
  const cat = categories.find((c) => c.id === Number(req.params.id) || c.slug === req.params.id);
  if (!cat) {
    return res.status(404).json({ detail: 'Catégorie non trouvée' });
  }
  return res.json(cat);
});

app.post('/api/categories', requireAdmin, (req: Request, res: Response) => {
  const { nom, description, image_url } = req.body;
  if (!nom) {
    return res.status(400).json({ detail: 'Le nom est obligatoire' });
  }

  const slug = generateSlug(nom);
  if (categories.some((c) => c.nom.toLowerCase() === nom.toLowerCase() || c.slug === slug)) {
    return res.status(400).json({ detail: 'Cette catégorie existe déjà' });
  }

  const newCat: Category = {
    id: nextCategoryId++,
    nom,
    description: description || '',
    image_url: image_url || '',
    slug,
    created_at: new Date().toISOString(),
  };
  categories.push(newCat);
  return res.status(201).json(newCat);
});

app.put('/api/categories/:id', requireAdmin, (req: Request, res: Response) => {
  const cat = categories.find((c) => c.id === Number(req.params.id));
  if (!cat) {
    return res.status(404).json({ detail: 'Catégorie non trouvée' });
  }

  const { nom, description, image_url } = req.body;
  if (nom !== undefined) {
    cat.nom = nom;
    cat.slug = generateSlug(nom);
  }
  if (description !== undefined) cat.description = description;
  if (image_url !== undefined) cat.image_url = image_url;

  return res.json(cat);
});

app.delete('/api/categories/:id', requireAdmin, (req: Request, res: Response) => {
  const idx = categories.findIndex((c) => c.id === Number(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ detail: 'Catégorie non trouvée' });
  }
  categories.splice(idx, 1);
  return res.json({ message: 'Catégorie supprimée' });
});

// ─── PRODUCTS ROUTER ──────────────────────────────────────────────────────────
app.get('/api/products', (req: Request, res: Response) => {
  const { category_id, search, min_price, max_price, sort, limit = '50', offset = '0' } = req.query;

  let result = products.filter((p) => p.is_active);

  if (category_id) {
    result = result.filter((p) => p.category_id === Number(category_id));
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    result = result.filter((p) => p.nom.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
  }
  if (min_price !== undefined) {
    result = result.filter((p) => p.prix >= Number(min_price));
  }
  if (max_price !== undefined) {
    result = result.filter((p) => p.prix <= Number(max_price));
  }

  if (sort === 'prix_asc') {
    result.sort((a, b) => a.prix - b.prix);
  } else if (sort === 'prix_desc') {
    result.sort((a, b) => b.prix - a.prix);
  } else if (sort === 'nom') {
    result.sort((a, b) => a.nom.localeCompare(b.nom));
  } else {
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const start = Number(offset) || 0;
  const count = Math.min(Number(limit) || 50, 100);
  const sliced = result.slice(start, start + count).map(getProductWithCategory);

  return res.json(sliced);
});

app.get('/api/products/all', requireAdmin, (_req: Request, res: Response) => {
  const sorted = [...products].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return res.json(sorted.map(getProductWithCategory));
});

app.get('/api/products/:id', (req: Request, res: Response) => {
  const p = products.find((prod) => prod.id === Number(req.params.id));
  if (!p) {
    return res.status(404).json({ detail: 'Produit non trouvé' });
  }
  return res.json(getProductWithCategory(p));
});

app.post('/api/products', requireAdmin, (req: Request, res: Response) => {
  const { nom, description, prix, prix_promo, stock, image_url, category_id, is_active } = req.body;
  if (!nom || prix === undefined || !category_id) {
    return res.status(400).json({ detail: 'Nom, prix et catégorie sont obligatoires' });
  }

  const cat = categories.find((c) => c.id === Number(category_id));
  if (!cat) {
    return res.status(404).json({ detail: 'Catégorie non trouvée' });
  }

  const newProduct: Product = {
    id: nextProductId++,
    nom,
    description: description || '',
    prix: Number(prix),
    prix_promo: prix_promo ? Number(prix_promo) : null,
    stock: Number(stock) || 0,
    image_url: image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    category_id: Number(category_id),
    is_active: is_active !== undefined ? Boolean(is_active) : true,
    created_at: new Date().toISOString(),
  };

  products.push(newProduct);
  return res.status(201).json(getProductWithCategory(newProduct));
});

app.put('/api/products/:id', requireAdmin, (req: Request, res: Response) => {
  const p = products.find((prod) => prod.id === Number(req.params.id));
  if (!p) {
    return res.status(404).json({ detail: 'Produit non trouvé' });
  }

  const { nom, description, prix, prix_promo, stock, image_url, category_id, is_active } = req.body;
  if (nom !== undefined) p.nom = nom;
  if (description !== undefined) p.description = description;
  if (prix !== undefined) p.prix = Number(prix);
  if (prix_promo !== undefined) p.prix_promo = prix_promo ? Number(prix_promo) : null;
  if (stock !== undefined) p.stock = Number(stock);
  if (image_url !== undefined) p.image_url = image_url;
  if (category_id !== undefined) p.category_id = Number(category_id);
  if (is_active !== undefined) p.is_active = Boolean(is_active);

  return res.json(getProductWithCategory(p));
});

app.patch('/api/products/:id/stock', requireAdmin, (req: Request, res: Response) => {
  const p = products.find((prod) => prod.id === Number(req.params.id));
  if (!p) {
    return res.status(404).json({ detail: 'Produit non trouvé' });
  }

  const { stock } = req.body;
  if (stock === undefined) {
    return res.status(400).json({ detail: 'Stock requis' });
  }

  p.stock = Number(stock);
  return res.json(getProductWithCategory(p));
});

app.delete('/api/products/:id', requireAdmin, (req: Request, res: Response) => {
  const idx = products.findIndex((prod) => prod.id === Number(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ detail: 'Produit non trouvé' });
  }
  products.splice(idx, 1);
  return res.json({ message: 'Produit supprimé' });
});

app.post('/api/products/upload-image', requireAdmin, upload.single('file'), (req: Request, res: Response) => {
  // If file was uploaded via multer (multipart/form-data)
  if (req.file) {
    return res.json({ url: `/uploads/${req.file.filename}` });
  }

  // If data URL sent in JSON body
  const dataUrl = req.body?.image;
  if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:image')) {
    const matches = dataUrl.match(/^data:image\/([A-Za-z+-/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, Buffer.from(matches[2], 'base64'));
      return res.json({ url: `/uploads/${filename}` });
    }
  }
  // Default placeholder
  return res.json({ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' });
});

app.post('/api/upload-image', requireAdmin, upload.single('file'), (req: Request, res: Response) => {
  if (req.file) {
    return res.json({ url: `/uploads/${req.file.filename}` });
  }

  const dataUrl = req.body?.image;
  if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:image')) {
    const matches = dataUrl.match(/^data:image\/([A-Za-z+-/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, Buffer.from(matches[2], 'base64'));
      return res.json({ url: `/uploads/${filename}` });
    }
  }

  return res.status(400).json({ detail: 'Aucun fichier ou image fourni' });
});

// ─── ORDERS ROUTER ────────────────────────────────────────────────────────────
function formatOrderResponse(order: Order) {
  const enrichedItems = order.items.map((it) => {
    const prod = products.find((p) => p.id === it.product_id);
    return {
      ...it,
      product: prod ? getProductWithCategory(prod) : undefined,
    };
  });
  const pay = payments.find((p) => p.order_id === order.id) || null;
  return {
    ...order,
    items: enrichedItems,
    payment: pay,
  };
}

app.post('/api/orders', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { items, nom_client, telephone, adresse } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ detail: 'La commande doit contenir au moins un article' });
  }

  let total = 0;
  const orderItems: OrderItem[] = [];

  for (const item of items) {
    const product = products.find((p) => p.id === Number(item.product_id));
    if (!product) {
      return res.status(404).json({ detail: `Produit ID ${item.product_id} non trouvé` });
    }
    if (product.stock < item.quantite) {
      return res.status(400).json({
        detail: `Stock insuffisant pour '${product.nom}' (disponible: ${product.stock})`,
      });
    }

    const unitPrice = product.prix_promo ? product.prix_promo : product.prix;
    total += unitPrice * item.quantite;

    // Deduct stock
    product.stock -= item.quantite;

    orderItems.push({
      id: nextOrderItemId++,
      order_id: nextOrderId,
      product_id: product.id,
      quantite: item.quantite,
      prix_unitaire: unitPrice,
    });
  }

  const order: Order = {
    id: nextOrderId++,
    user_id: user.id,
    total: Math.round(total),
    statut: 'en_attente',
    nom_client: nom_client || user.nom,
    telephone: telephone || user.telephone,
    adresse: adresse || '',
    created_at: new Date().toISOString(),
    items: orderItems,
    payment: null,
  };

  orders.push(order);
  return res.status(201).json(formatOrderResponse(order));
});

app.get('/api/orders/my', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const userOrders = orders
    .filter((o) => o.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(formatOrderResponse);

  return res.json(userOrders);
});

app.get('/api/orders', requireAdmin, (_req: Request, res: Response) => {
  const all = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(formatOrderResponse);
  return res.json(all);
});

app.get('/api/orders/:id', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) {
    return res.status(404).json({ detail: 'Commande non trouvée' });
  }

  if (user.role !== 'admin' && order.user_id !== user.id) {
    return res.status(403).json({ detail: 'Accès non autorisé' });
  }

  return res.json(formatOrderResponse(order));
});

app.put('/api/orders/:id/status', requireAdmin, (req: Request, res: Response) => {
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) {
    return res.status(404).json({ detail: 'Commande non trouvée' });
  }

  const { statut } = req.body;
  const validStatuses = ['en_attente', 'confirmee', 'en_livraison', 'livree', 'annulee'];
  if (!validStatuses.includes(statut)) {
    return res.status(400).json({ detail: `Statut invalide. Valeurs possibles: ${validStatuses.join(', ')}` });
  }

  // Restore stock if cancelling
  if (statut === 'annulee' && order.statut !== 'annulee') {
    for (const item of order.items) {
      const prod = products.find((p) => p.id === item.product_id);
      if (prod) {
        prod.stock += item.quantite;
      }
    }
  }

  order.statut = statut;
  return res.json(formatOrderResponse(order));
});

// ─── PAYMENTS ROUTER ──────────────────────────────────────────────────────────
app.post('/api/payments', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { order_id, methode, telephone } = req.body;

  const order = orders.find((o) => o.id === Number(order_id));
  if (!order) {
    return res.status(404).json({ detail: 'Commande non trouvée' });
  }

  if (user.role !== 'admin' && order.user_id !== user.id) {
    return res.status(403).json({ detail: 'Accès non autorisé' });
  }

  const existingPayment = payments.find((p) => p.order_id === Number(order_id));
  if (existingPayment) {
    return res.status(400).json({ detail: 'Un paiement existe déjà pour cette commande' });
  }

  const validMethods = ['orange_money', 'wave', 'sur_place'];
  if (!validMethods.includes(methode)) {
    return res.status(400).json({ detail: `Méthode invalide. Valeurs: ${validMethods.join(', ')}` });
  }

  const ref = `BZS-${Math.random().toString(16).substring(2, 10).toUpperCase()}`;

  let paymentStatus: 'completee' | 'en_attente' | 'echouee' = 'en_attente';
  if (methode === 'orange_money' || methode === 'wave') {
    if (!telephone) {
      return res.status(400).json({ detail: `Numéro de téléphone requis pour ${methode}` });
    }
    paymentStatus = 'completee';
    order.statut = 'confirmee';
  } else {
    paymentStatus = 'en_attente';
  }

  const payment: Payment = {
    id: nextPaymentId++,
    order_id: order.id,
    methode,
    statut: paymentStatus,
    reference: ref,
    montant: order.total,
    telephone: telephone || '',
    created_at: new Date().toISOString(),
  };

  payments.push(payment);
  order.payment = payment;

  return res.status(201).json(payment);
});

app.get('/api/payments/:order_id', authenticateToken, (req: Request, res: Response) => {
  const payment = payments.find((p) => p.order_id === Number(req.params.order_id));
  if (!payment) {
    return res.status(404).json({ detail: 'Paiement non trouvé' });
  }
  return res.json(payment);
});

// ─── DASHBOARD ROUTER ─────────────────────────────────────────────────────────
app.get('/api/dashboard/stats', requireAdmin, (_req: Request, res: Response) => {
  const totalRevenue = payments
    .filter((p) => p.statut === 'completee')
    .reduce((sum, p) => sum + p.montant, 0);

  const totalOrders = orders.length;
  const totalProducts = products.length;
  const lowStock = products.filter((p) => p.stock <= 5 && p.is_active).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const ordersToday = orders.filter((o) => o.created_at.startsWith(todayStr)).length;

  const recentOrders = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map(formatOrderResponse);

  return res.json({
    total_revenue: totalRevenue,
    total_orders: totalOrders,
    total_products: totalProducts,
    low_stock_products: lowStock,
    orders_today: ordersToday,
    recent_orders: recentOrders,
  });
});

// ─── SITE SETTINGS ROUTER ────────────────────────────────────────────────────
app.get('/api/settings', (_req: Request, res: Response) => {
  return res.json(siteSettings);
});

app.put('/api/settings', requireAdmin, (req: Request, res: Response) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ detail: 'Données de configuration invalides' });
  }

  siteSettings = {
    ...siteSettings,
    ...updates,
    frais_livraison_dakar: Number(updates.frais_livraison_dakar) || siteSettings.frais_livraison_dakar,
    frais_livraison_regions: Number(updates.frais_livraison_regions) || siteSettings.frais_livraison_regions,
    livraison_gratuite_min: Number(updates.livraison_gratuite_min) || siteSettings.livraison_gratuite_min,
  };

  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(siteSettings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write settings.json', err);
  }

  return res.json({
    message: 'Paramètres du site mis à jour avec succès',
    settings: siteSettings,
  });
});

// ─── RECEIPTS ROUTER (HTML Printable Receipt) ──────────────────────────────────
app.get('/api/receipts/:order_id', (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) {
    return res.status(401).send('Token manquant');
  }

  let user: User | undefined;
  try {
    const payload = jwt.verify(token, SECRET_KEY) as { sub: number };
    user = users.find((u) => u.id === Number(payload.sub));
  } catch {
    return res.status(401).send('Token invalide');
  }

  if (!user) {
    return res.status(401).send('Utilisateur non trouvé');
  }

  const order = orders.find((o) => o.id === Number(req.params.order_id));
  if (!order) {
    return res.status(404).send('Commande non trouvée');
  }

  if (user.role !== 'admin' && order.user_id !== user.id) {
    return res.status(403).send('Accès non autorisé');
  }

  const payment = payments.find((p) => p.order_id === order.id);
  const enriched = formatOrderResponse(order);

  const rows = enriched.items
    .map((item) => {
      const name = item.product ? item.product.nom : `Produit #${item.product_id}`;
      return `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantite}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.prix_unitaire.toLocaleString('fr-FR')} FCFA</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${(item.prix_unitaire * item.quantite).toLocaleString('fr-FR')} FCFA</td>
      </tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Reçu de Commande #${order.id} - BazarShop</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; margin: 0; padding: 30px 15px; color: #1a1a2e; }
    .receipt-card { max-width: 650px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 40px; }
    .header { text-align: center; border-bottom: 2px solid #F68B1E; padding-bottom: 20px; margin-bottom: 25px; }
    .logo { font-size: 28px; font-weight: 800; color: #F68B1E; margin: 0; }
    .tagline { color: #6b7280; font-size: 14px; margin-top: 4px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; font-size: 14px; }
    .info-grid p { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px; }
    th { background: #F68B1E; color: white; padding: 10px; text-align: left; }
    th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
    th:nth-child(2) { text-align: center; }
    .total-box { text-align: right; margin-top: 15px; font-size: 18px; font-weight: bold; color: #F68B1E; }
    .payment-box { background: #FFF5EB; border-radius: 8px; padding: 15px; margin-top: 20px; font-size: 14px; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af; border-top: 1px solid #eee; padding-top: 15px; }
    .print-btn { display: block; margin: 0 auto 20px; background: #F68B1E; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; }
    @media print { .print-btn { display: none; } body { background: white; padding: 0; } .receipt-card { box-shadow: none; padding: 20px; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Imprimer le reçu</button>
  <div class="receipt-card">
    <div class="header">
      <h1 class="logo">🛒 BazarShop</h1>
      <div class="tagline">Votre boutique en ligne de confiance</div>
    </div>
    <div class="info-grid">
      <div>
        <p><strong>Commande :</strong> #${order.id}</p>
        <p><strong>Date :</strong> ${new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        <p><strong>Statut :</strong> ${order.statut}</p>
      </div>
      <div>
        <p><strong>Client :</strong> ${order.nom_client || user.nom}</p>
        <p><strong>Téléphone :</strong> ${order.telephone || user.telephone || 'N/A'}</p>
        <p><strong>Adresse :</strong> ${order.adresse || 'N/A'}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Produit</th>
          <th>Qté</th>
          <th>Prix Unit.</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <div class="total-box">
      TOTAL : ${order.total.toLocaleString('fr-FR')} FCFA
    </div>
    ${
      payment
        ? `<div class="payment-box">
        <strong>Mode de paiement :</strong> ${payment.methode.toUpperCase()}<br/>
        <strong>Référence :</strong> ${payment.reference || 'N/A'}<br/>
        <strong>Statut paiement :</strong> ${payment.statut}
      </div>`
        : ''
    }
    <div class="footer">
      Merci pour votre achat ! 🙏<br />
      BazarShop — contact@bazarshop.com
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
});

// ─── GEMINI CHATBOT ROUTER ───────────────────────────────────────────────────
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, role = 'shopping_assistant', taskType = 'general' } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'La liste des messages est requise.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "La clé API Gemini n'est pas configurée dans l'environnement.",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Model selection based on instruction:
    // "Use gemini-3.1-pro-preview for particularly complex tasks, gemini-3.5-flash for general tasks, and gemini-3.1-flash-lite for tasks that should happen fast."
    let model = 'gemini-3.5-flash';
    if (taskType === 'complex') {
      model = 'gemini-3.1-pro-preview';
    } else if (taskType === 'fast') {
      model = 'gemini-3.1-flash-lite';
    }

    // Prepare catalog context to assist customer with real shop items
    const activeProductsSummary = products
      .filter((p) => p.is_active)
      .map(
        (p) =>
          `- ${p.nom} (Catégorie: ${categories.find((c) => c.id === p.category_id)?.nom || 'Divers'}, Prix: ${p.prix_promo || p.prix} FCFA, Stock: ${p.stock > 0 ? `${p.stock} unités` : 'Épuisé'}, Description: ${p.description || 'N/A'})`
      )
      .join('\n');

    let systemInstruction = `Tu es l'assistant virtuel intelligent officiel de BazarShop, la boutique en ligne inspirée de Jumia au Sénégal.
Tu réponds de façon chaleureuse, polie, claire et dynamique en français.
Les paiements acceptés sur BazarShop sont : Wave, Orange Money, et Paiement sur place (à la livraison).
La monnaie est le Franc CFA (FCFA).

Catalogue actuel des produits disponibles sur BazarShop :
${activeProductsSummary}

Règles :
1. Aide les clients à trouver le meilleur produit selon leurs besoins et leur budget.
2. Si un client demande un produit en rupture de stock, propose une alternative du catalogue.
3. Renseigne sur les modes de livraison et de paiement (Wave, Orange Money, Sur place).
4. Sois concis, bienveillant et utilise des émojis adaptés.`;

    if (role === 'tech_expert') {
      systemInstruction += `\nSpécialité : Tu es l'expert technique et high-tech de BazarShop (smartphones, ordinateurs, accessoires audio, spécifications techniques, comparatifs). Donne des conseils précis et des analyses comparatives détaillées.`;
    } else if (role === 'fashion_advisor') {
      systemInstruction += `\nSpécialité : Tu es le styliste et conseiller mode/beauté de BazarShop. Conseille sur le style vestimentaire, les tailles, les tendances et les parfums.`;
    } else if (role === 'customer_service') {
      systemInstruction += `\nSpécialité : Tu es le responsable service client et support après-vente. Aide avec les retours, le suivi des commandes, le paiement Wave/Orange Money et la facturation.`;
    }

    // Format conversation history for Gemini generateContent
    // Contents structure: array of { role: 'user' | 'model', parts: [{ text: string }] }
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || "Désolé, je n'ai pas pu générer de réponse pour le moment.";
    return res.json({ reply, modelUsed: model });
  } catch (error: any) {
    console.error('Erreur Gemini Chatbot:', error);
    let errMsg = "Une erreur est survenue lors de la communication avec l'assistant Gemini.";
    if (error?.message?.includes('API key') || error?.message?.includes('API_KEY')) {
      errMsg = "La clé API Gemini est absente ou invalide. Veuillez vérifier la configuration de l'environnement.";
    } else if (error?.message) {
      try {
        const parsed = JSON.parse(error.message);
        if (parsed?.error?.message) {
          errMsg = parsed.error.message;
        }
      } catch {
        errMsg = error.message;
      }
    }
    return res.status(500).json({ error: errMsg });
  }
});

// ─── VITE INTEGRATION ─────────────────────────────────────────────────────────
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', hmr: false, ws: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
