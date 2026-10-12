import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/useAuth';
import SocialButtons from './SocialButtons';
import { AlertCircle, BarChart3, Target, GraduationCap, Repeat } from 'lucide-react';
import InteractiveBoard from '../../components/Chessboard/InteractiveBoard';

const perks = [
  { icon: BarChart3, text: 'Stockfish finds the mistakes in your games' },
  { icon: Target, text: 'Practice built from your own positions' },
  { icon: GraduationCap, text: 'Learn from Grandmaster examples' },
  { icon: Repeat, text: 'Spaced review so lessons stick' },
];

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const { signIn, signUp } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(location.state?.message || null);
  const [busy, setBusy] = useState(false);
  const set = k => e => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isSignup) await signUp(form);
      else await signIn(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-brand" aria-hidden="true">
        <span className="auth-logo"><span className="sidebar-logo-icon">♟</span> ChessMind</span>
        <div className="auth-brand-main">
          <h2>Turn your chess mistakes into practice.</h2>
          <ul>
            {perks.map(p => (
              <li key={p.text}><p.icon size={18} /> {p.text}</li>
            ))}
          </ul>
          <div className="auth-brand-board">
            <InteractiveBoard fen="r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4" interactive={false} />
          </div>
        </div>
        <p className="auth-brand-foot">Connect Chess.com or Lichess · Stockfish analysis · Personalised practice</p>
      </aside>
      <div className="auth-card card-glass animate-slide-up">
        <Link to="/welcome" className="auth-logo"><span className="sidebar-logo-icon">♟</span> ChessMind</Link>
        <h1 className="page-title" style={{ fontSize: '1.6rem' }}>{isSignup ? 'Create a free account' : 'Welcome back'}</h1>
        <p className="page-subtitle" style={{ marginBottom: 20 }}>
          {isSignup ? 'Turn your mistakes into practice.' : 'Sign in to continue improving.'}
        </p>

        <SocialButtons redirectTo={from} onError={setError} />
        <div className="auth-divider"><span>or use email</span></div>

        <form onSubmit={submit} className="flex flex-col gap-md">
          {isSignup && <input className="input" placeholder="Display name (optional)" value={form.name} onChange={set('name')} />}
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={set('password')} required />
          {error && (
            <div className="form-error"><AlertCircle size={16} /> <span>{error}</span></div>
          )}
          <button className="btn btn-primary btn-lg w-full" disabled={busy}>
            {busy ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="text-secondary" style={{ textAlign: 'center', marginTop: 16, fontSize: '0.88rem' }}>
          {isSignup ? 'Already have an account? ' : 'New to ChessMind? '}
          <Link to={isSignup ? '/login' : '/signup'} state={{ from }} style={{ color: 'var(--accent-primary)' }}>
            {isSignup ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: '0.8rem' }}>
          <Link to="/welcome" className="text-muted">What is ChessMind?</Link>
        </p>
      </div>
    </div>
  );
}
