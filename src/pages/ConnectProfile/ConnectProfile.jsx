import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import api from '../../services/api';
import { startLichessLogin } from '../../services/lichessAuth';
import { Link2, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Copy } from 'lucide-react';

const newCode = () => `chessmind-${crypto.randomUUID().slice(0, 8)}`;

export default function ConnectProfile() {
  const navigate = useNavigate();
  const { account, setAccount, setProfile, setStats, setGames, addToast } = useStore();

  const [platform, setPlatform] = useState(account?.platform || 'chesscom');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState(null); // set once the user asks to verify a Chess.com account
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);

  async function importVerified(plat, name, token) {
    const conn = await api.connectProfile(plat, name, token);
    setAccount({ platform: plat, username: conn.profile.username, verified: true, ownershipToken: token });
    setProfile(conn.profile);
    setStats(conn.stats);
    addToast({ type: 'success', message: `Verified ${conn.profile.username}! Fetching games...` });
    const gamesResult = await api.fetchGames(plat, conn.profile.username, 50);
    setGames(gamesResult.games || []);
    setResultData({ profile: conn.profile, gamesCount: gamesResult.games?.length || 0 });
  }

  function start(e) {
    e.preventDefault();
    if (!username.trim()) return setError('Please enter your Chess.com username');
    setError(null);
    setCode(newCode());
  }

  async function verify() {
    setLoading(true);
    setError(null);
    try {
      const proof = await api.request('/profile/verify', {
        method: 'POST',
        body: JSON.stringify({ platform: 'chesscom', username: username.trim(), code }),
      });
      await importVerified('chesscom', username.trim(), proof.token);
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-slide-up" style={{ maxWidth: 640, margin: '0 auto', paddingTop: 'var(--space-md)' }}>
      <div className="page-header text-center">
        <h1 className="page-title">Connect Chess Profile</h1>
        <p className="page-subtitle">Prove the account is yours, then your own games are imported</p>
      </div>

      {account?.verified && (
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          Connected: <strong>{account.username}</strong> ({account.platform === 'chesscom' ? 'Chess.com' : 'Lichess'}) — verified
        </div>
      )}

      <div className="card-glass" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="platform-selector">
          <div className={`platform-option ${platform === 'chesscom' ? 'selected' : ''}`} onClick={() => { setPlatform('chesscom'); setCode(null); setError(null); }}>
            <div className="platform-option-icon">♟️</div>
            <div className="platform-option-name">Chess.com</div>
            <div className="platform-option-desc">Verify with a code in your profile</div>
          </div>
          <div className={`platform-option ${platform === 'lichess' ? 'selected' : ''}`} onClick={() => { setPlatform('lichess'); setCode(null); setError(null); }}>
            <div className="platform-option-icon">♞</div>
            <div className="platform-option-name">Lichess.org</div>
            <div className="platform-option-desc">Sign in on Lichess</div>
          </div>
        </div>

        {platform === 'lichess' ? (
          <>
            <p className="text-secondary" style={{ fontSize: '0.88rem', margin: '16px 0' }}>
              You'll sign in on lichess.org. ChessMind only learns your username — never your password.
            </p>
            <button className="btn btn-primary btn-lg w-full" onClick={() => startLichessLogin('/games')}>
              <Link2 size={20} /> Sign in with Lichess
            </button>
          </>
        ) : !code ? (
          <form onSubmit={start} style={{ marginTop: 16 }}>
            <label className="input-label" htmlFor="usernameInput">Your Chess.com username</label>
            <input id="usernameInput" className="input input-lg" placeholder="Your own Chess.com username" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
            <button type="submit" className="btn btn-primary btn-lg w-full" style={{ marginTop: 16 }}>Continue</button>
          </form>
        ) : (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: '0.9rem', marginBottom: 8 }}>To prove <strong>{username}</strong> is yours:</p>
            <ol className="text-secondary" style={{ fontSize: '0.88rem', paddingLeft: 20, lineHeight: 1.7 }}>
              <li>Log in to Chess.com and open <em>Settings → Profile</em>.</li>
              <li>Paste this code into the <strong>Location</strong> field and save:</li>
            </ol>
            <div className="flex items-center gap-sm" style={{ margin: '10px 0' }}>
              <code style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 8, fontSize: '1rem' }}>{code}</code>
              <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(code)}><Copy size={14} /> Copy</button>
            </div>
            <p className="text-secondary" style={{ fontSize: '0.88rem' }}>3. Come back and press Verify. You can remove the code afterwards.</p>
            <button className="btn btn-primary btn-lg w-full" style={{ marginTop: 12 }} onClick={verify} disabled={loading}>
              {loading ? <><div className="spinner" /> Verifying...</> : 'Verify & import my games'}
            </button>
            <button className="btn btn-ghost btn-sm w-full" style={{ marginTop: 8 }} onClick={() => setCode(null)}>Use a different username</button>
          </div>
        )}

        {error && (
          <div className="form-error" style={{ marginTop: 16 }}><AlertCircle size={18} /> <span>{error}</span></div>
        )}

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              useStore.getState().loadDemoAccount();
              addToast({ type: 'success', message: 'Sample profile & games loaded (not your real games).' });
              navigate('/games');
            }}
            style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}
          >
            ✨ Or explore with sample games
          </button>
        </div>
      </div>

      {resultData && (
        <div className="card animate-fade-in" style={{ border: '1px solid var(--accent-success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--space-md)' }}>
            <CheckCircle2 size={24} style={{ color: 'var(--accent-success)' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Profile verified!</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Loaded {resultData.profile.username} ({resultData.gamesCount} games)
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary w-full" onClick={() => navigate('/games')}>View Imported Games <ArrowRight size={16} /></button>
            <button className="btn btn-secondary w-full" onClick={() => navigate('/')}>Go to Dashboard</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 'var(--space-xl)', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
        <ShieldCheck size={16} />
        <span>We never ask for your chess password. Ownership is proven on the chess site itself.</span>
      </div>
    </div>
  );
}
