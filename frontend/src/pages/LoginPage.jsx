import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './AuthPages.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Bienvenue, ${user.nom} !`);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page fade-in">
      <div className="auth-card card">
        <div className="auth-header">
          <h1>Connexion</h1>
          <p>Accédez à votre compte BazarShop</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label><FiMail /> Email</label>
            <input
              className="input"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label><FiLock /> Mot de passe</label>
            <input
              className="input"
              type="password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'} <FiArrowRight />
          </button>
        </form>

        <div className="auth-footer">
          <p>Pas encore de compte ? <Link to="/register">Créer un compte</Link></p>
        </div>

        <div className="auth-demo">
          <p><strong>Compte démo admin :</strong></p>
          <code>admin@bazarshop.com / admin123</code>
        </div>
      </div>
    </div>
  );
}
