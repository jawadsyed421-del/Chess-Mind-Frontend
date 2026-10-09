import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import api from '../../services/api';
import {
  Gamepad2,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Calendar,
  Clock,
  Sparkles,
  Award
} from 'lucide-react';

export default function Games() {
  const navigate = useNavigate();
  const { account, games, setGames, loadDemoAccount, addToast } = useStore();

  const [search, setSearch] = useState('');
  const [filterResult, setFilterResult] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefreshGames() {
    if (!account) return;
    setRefreshing(true);
    try {
      const res = await api.fetchGames(account.platform, account.username, 40);
      setGames(res.games || []);
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
    return matchesSearch && matchesResult;
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
            Imported from {account.platform === 'chesscom' ? 'Chess.com' : 'Lichess'} ({games.length} total)
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
                  <div className="game-opening">
                    {game.opening_name || 'Standard Chess'}
                  </div>
                </div>

                <div className="game-date" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} />
                  <span>{formattedDate}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge" style={{ fontSize: '0.75rem', gap: '5px', background: 'var(--bg-tertiary)', padding: '2px 8px' }}>
                    <span className={`platform-dot ${game.platform || 'chesscom'}`} />
                    {game.platform === 'lichess' ? 'Lichess' : 'Chess.com'}
                  </span>

                  <span className={`badge badge-${game.analysis_status || 'pending'}`} style={{ gap: '4px' }}>
                    <Sparkles size={11} />
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
