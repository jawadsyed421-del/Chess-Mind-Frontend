import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import api from '../../services/api';
import { Link2, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

export default function ConnectProfile() {
  const navigate = useNavigate();
  const { account, setAccount, setProfile, setStats, setGames, addToast } = useStore();

  const [platform, setPlatform] = useState(account?.platform || 'chesscom');
  const [username, setUsername] = useState(account?.username || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);

  async function handleConnect(e) {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Connect profile and retrieve stats
      const connResult = await api.connectProfile(platform, username.trim());
      
      const newAccount = { platform, username: connResult.profile.username };
      setAccount(newAccount);
      setProfile(connResult.profile);
      setStats(connResult.stats);

      // 2. Automatically fetch recent games
      addToast({ type: 'success', message: `Connected to ${connResult.profile.username}! Fetching games...` });

      const gamesResult = await api.fetchGames(platform, connResult.profile.username, 30);
      setGames(gamesResult.games || []);

      setResultData({
        profile: connResult.profile,
        stats: connResult.stats,
        gamesCount: gamesResult.games?.length || 0,
      });

      addToast({
        type: 'success',
        message: `Imported ${gamesResult.games?.length || 0} games successfully!`,
      });
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect. Please verify username and try again.');
      addToast({ type: 'error', message: err.message || 'Connection failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-slide-up" style={{ maxWidth: 640, margin: '0 auto', paddingTop: 'var(--space-md)' }}>
      <div className="page-header text-center">
        <h1 className="page-title">Connect Chess Profile</h1>
        <p className="page-subtitle">
          Import your real games from Chess.com or Lichess to start personalized coaching
        </p>
      </div>

      <div className="card-glass" style={{ marginBottom: 'var(--space-xl)' }}>
        <form onSubmit={handleConnect}>
          <label className="input-label" style={{ marginBottom: 'var(--space-sm)', display: 'block' }}>
            Choose Platform
          </label>
          <div className="platform-selector">
            <div
              className={`platform-option ${platform === 'chesscom' ? 'selected' : ''}`}
              onClick={() => setPlatform('chesscom')}
            >
              <div className="platform-option-icon">♟️</div>
              <div className="platform-option-name">Chess.com</div>
              <div className="platform-option-desc">Public account & game archives</div>
            </div>

            <div
              className={`platform-option ${platform === 'lichess' ? 'selected' : ''}`}
              onClick={() => setPlatform('lichess')}
            >
              <div className="platform-option-icon">♞</div>
              <div className="platform-option-name">Lichess.org</div>
              <div className="platform-option-desc">Open-source & free API</div>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
            <label className="input-label" htmlFor="usernameInput">
              {platform === 'chesscom' ? 'Chess.com' : 'Lichess'} Username
            </label>
            <input
              id="usernameInput"
              className="input input-lg"
              placeholder={platform === 'chesscom' ? 'e.g. magnuscarlsen or hikaru' : 'e.g. thibault'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
              No password needed! ChessMind only reads your public games.
            </span>
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 92, 92, 0.1)',
              border: '1px solid rgba(255, 92, 92, 0.3)',
              color: 'var(--accent-danger)',
              fontSize: '0.88rem',
              marginBottom: 'var(--space-md)'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" />
                <span>Syncing Profile & Games...</span>
              </>
            ) : (
              <>
                <Link2 size={20} />
                <span>Connect & Import Games</span>
              </>
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                useStore.getState().loadDemoAccount();
                addToast({ type: 'success', message: 'Demo profile & game library loaded!' });
                navigate('/games');
              }}
              style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}
            >
              ✨ Or test with sample games library (1-click Demo)
            </button>
          </div>
        </form>
      </div>

      {/* Result Card after successful connect */}
      {resultData && (
        <div className="card animate-fade-in" style={{ border: '1px solid var(--accent-success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-md)' }}>
            <CheckCircle2 size={24} style={{ color: 'var(--accent-success)' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Profile Connected!</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Loaded {resultData.profile.username} ({resultData.gamesCount} games retrieved)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--space-md)' }}>
            <button
              className="btn btn-primary w-full"
              onClick={() => navigate('/games')}
            >
              <span>View Imported Games</span>
              <ArrowRight size={16} />
            </button>
            <button
              className="btn btn-secondary w-full"
              onClick={() => navigate('/')}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Privacy and Trust note */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginTop: 'var(--space-xl)', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
        <ShieldCheck size={16} />
        <span>Read-only public integration. We never ask for your password.</span>
      </div>
    </div>
  );
}
