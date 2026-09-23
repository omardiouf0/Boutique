import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiPhone, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './AuthPages.css';

export default function RegisterPage() {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    try {
      await register(nom, email, password, telephone || null);
      toast.success('Compte créé avec succès !');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page fade-in">
      <div className="auth-card card">
        <div className="auth-header">
          <h1>Créer un compte</h1>
          <p>Rejoignez BazarShop et commencez vos achats</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label><FiUser /> Nom complet</label>
            <input className="input" type="text" placeholder="Votre nom" value={nom} onChange={e => setNom(e.target.value)} required />
          </div>

          <div className="input-group">
            <label><FiMail /> Email</label>
            <input className="input" type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="input-group">
            <label><FiPhone /> Téléphone (optionnel)</label>
            <input className="input" type="tel" placeholder="+221 7X XXX XX XX" value={telephone} onChange={e => setTelephone(e.target.value)} />
          </div>

          <div className="input-group">
            <label><FiLock /> Mot de passe</label>
            <input className="input" type="password" placeholder="Minimum 6 caractères" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading}>
            {loading ? 'Inscription...' : 'Créer mon compte'} <FiArrowRight />
          </button>
        </form>

        <div className="auth-footer">
          <p>Déjà un compte ? <Link to="/login">Se connecter</Link></p>
        </div>
      </div>
    </div>
  );
}
