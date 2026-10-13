import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import api from '../../services/api';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const PLATFORMS = {
  chesscom: { name: 'Chess.com', icon: '♟️' },
  lichess: { name: 'Lichess.org', icon: '♞' },
};

export default function ConnectProfile() {
  const navigate = useNavigate();
  const { account, setAccount, setProfile, setStats, setGames, addToast } = useStore();

  const [platform, setPlatform] = useState(account?.platform || 'chesscom');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);

  const platformName = PLATFORMS[platform].name;

  function choose(next) {
    setPlatform(next);
    setError(null);
    setResultData(null);
  }

  // Imports the public profile, stats and recent games for the entered username.
  async function importProfile(e) {
    e.preventDefault();
    const name = username.trim();
    if (!name) return setError(`Please enter your ${platformName} username`);
    setLoading(true);
    setError(null);
    try {
      const conn = await api.connectProfile(platform, name);
      setAccount({ platform, username: conn.profile.username });
      setProfile(conn.profile);
      setStats(conn.stats);
      addToast({ type: 'success', message: `Connected ${conn.profile.username}! Importing games...` });
      const gamesResult = await api.fetchGames(platform, conn.profile.username, 50);
      setGames(gamesResult.games || []);
      setResultData({ profile: conn.profile, gamesCount: gamesResult.games?.length || 0 });
    } catch (err) {
      setError(err.message || 'Could not import this profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-slide-up" style={{ maxWidth: 640, margin: '0 auto', paddingTop: 'var(--space-md)' }}>
      <div className="page-header text-center">
        <h1 className="page-title">Connect Chess Profile</h1>
        <p className="page-subtitle">Pick your platform, enter your username and we'll import your games</p>
      </div>

      {account && (
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          Connected: <strong>{account.username}</strong> ({PLATFORMS[account.platform]?.name || account.platform})
        </div>
      )}

      <div className="card-glass" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="platform-selector">
          {Object.entries(PLATFORMS).map(([key, p]) => (
            <div key={key} className={`platform-option ${platform === key ? 'selected' : ''}`} onClick={() => choose(key)}>
              <div className="platform-option-icon">{p.icon}</div>
              <div className="platform-option-name">{p.name}</div>
              <div className="platform-option-desc">Import with your username</div>
            </div>
          ))}
        </div>

        <form onSubmit={importProfile} style={{ marginTop: 16 }}>
          <label className="input-label" htmlFor="usernameInput">Your {platformName} username</label>
          <input
            id="usernameInput"
            className="input input-lg"
            placeholder={`Your ${platformName} username`}
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn-primary btn-lg w-full" style={{ marginTop: 16 }} disabled={loading}>
            {loading ? <><div className="spinner" /> Importing...</> : 'Import my games'}
          </button>
        </form>

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
            Or explore with sample games
          </button>
        </div>
      </div>

      {resultData && (
        <div className="card animate-fade-in" style={{ border: '1px solid var(--accent-success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--space-md)' }}>
            <CheckCircle2 size={24} style={{ color: 'var(--accent-success)' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Profile connected!</h3>
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
        <span>We never ask for your chess password. Only your public games are imported.</span>
      </div>
    </div>
  );
}
