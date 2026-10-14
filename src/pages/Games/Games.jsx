import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import api from '../../services/api';
import {
  Gamepad2,
  RefreshCw,
  Search,
  Filter,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { platformName } from '../../utils/gameInsights';

export default function Games() {
  const navigate = useNavigate();
  const { account, games, setGames, loadDemoAccount, addToast } = useStore();

  const [search, setSearch] = useState('');
  const [filterResult, setFilterResult] = useState('all');
  const [filterColor, setFilterColor] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterTc, setFilterTc] = useState('all');
  const timeControls = [...new Set(games.map(g => g.time_control).filter(Boolean))];
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefreshGames() {
    if (!account) return;
    setRefreshing(true);
    try {
      const res = await api.fetchGames(account.platform, account.username, 40);
      // Keep analysis done locally; fresh fields (e.g. platform accuracy) come from the sync.
      const known = new Map(games.map(g => [g.platform_game_id, g]));
      setGames((res.games || []).map(g => {
        const old = known.get(g.platform_game_id);
        return old ? { ...g, analysis_status: old.analysis_status, engine_accuracy: old.engine_accuracy } : g;
      }));
      addToast({ type: 'success', message: `Synced ${res.games?.length || 0} games!` });
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to sync games' });
    } finally {
      setRefreshing(false);
    }
  }

  const filteredGames = games.filter(g => {
    const matchesSearch =
      (g.opponent || '').toLowerCase().includes(search.toLowerCase()) ||
      (g.opening_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesResult =
      filterResult === 'all' ? true : g.result === filterResult;
    return matchesSearch && matchesResult
      && (filterColor === 'all' || g.player_color === filterColor)
      && (filterPlatform === 'all' || g.platform === filterPlatform)
      && (filterTc === 'all' || g.time_control === filterTc);
  });

  if (!account && games.length === 0) {
    return (
      <div className="empty-state animate-slide-up">
        <div className="empty-state-icon">♟️</div>
        <h2 className="empty-state-title">No Account Connected</h2>
        <p className="empty-state-desc">
          Connect your Chess.com or Lichess profile to import and analyze your games.
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--space-md)' }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/connect')}
          >
            Connect Profile Now
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              loadDemoAccount();
              addToast({ type: 'success', message: 'Loaded demo games library!' });
            }}
          >
            Load Sample Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">My Games</h1>
          <p className="page-subtitle">
            Imported from {platformName(account?.platform)} ({games.length} total)
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleRefreshGames}
          disabled={refreshing}
          style={{ gap: '8px' }}
        >
          <RefreshCw size={16} className={refreshing ? 'spinner' : ''} />
          <span>{refreshing ? 'Syncing...' : 'Sync New Games'}</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              className="input"
              placeholder="Search opponent or opening..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Filter size={16} style={{ color: 'var(--text-tertiary)' }} />
            {['all', 'win', 'loss', 'draw'].map((res) => (
              <button
                key={res}
                className={`btn btn-sm ${filterResult === res ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilterResult(res)}
                style={{ textTransform: 'capitalize' }}
              >
                {res === 'all' ? 'All' : res}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginTop: 'var(--space-md)' }}>
          <select className="input" style={{ maxWidth: 160 }} value={filterColor} onChange={e => setFilterColor(e.target.value)}>
            <option value="all">Any colour</option><option value="white">White</option><option value="black">Black</option>
          </select>
          <select className="input" style={{ maxWidth: 160 }} value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}>
            <option value="all">All platforms</option><option value="chesscom">Chess.com</option><option value="lichess">Lichess</option>
          </select>
          <select className="input" style={{ maxWidth: 160 }} value={filterTc} onChange={e => setFilterTc(e.target.value)}>
            <option value="all">Any time control</option>
            {timeControls.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Games List Table */}
      {filteredGames.length === 0 ? (
        <div className="empty-state">
          <Gamepad2 size={40} style={{ color: 'var(--text-tertiary)' }} />
          <h3 style={{ fontSize: '1.1rem', marginTop: '12px' }}>No games found</h3>
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
            {games.length === 0 ? "Click 'Sync New Games' to import your match history." : "Try adjusting your search filters."}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredGames.map((game, index) => {
            const formattedDate = game.date_played
              ? new Date(game.date_played).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent';

            return (
              <div
                key={game.platform_game_id || index}
                className="game-list-item"
                onClick={() => navigate(`/analysis?id=${encodeURIComponent(game.platform_game_id)}`)}
              >
                <div
                  className={`game-color-indicator ${game.player_color}`}
                  title={`Played as ${game.player_color}`}
                />

                <div className="game-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="game-opponent">vs {game.opponent}</span>
                    <span className={`badge badge-${game.result}`}>
                      {game.result}
                    </span>
                  </div>
                  <div className="game-opening" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`platform-dot ${game.platform || 'chesscom'}`} />
                    {platformName(game.platform)}
                  </div>
                </div>

                <div className="game-date" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} />
                  <span>{formattedDate}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge badge-${game.analysis_status || 'pending'}`} style={{ gap: '4px' }}>
                    {game.analysis_status === 'complete' ? 'Analyzed' : 'Ready to Analyze'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-primary)' }}>
                  <ChevronRight size={18} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
