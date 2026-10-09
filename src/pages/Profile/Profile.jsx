import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import {
  User,
  ShieldAlert,
  Award,
  TrendingUp,
  Target,
  RefreshCw,
  LogOut,
  ChevronRight,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  History
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const {
    account,
    profile,
    stats,
    games,
    weaknesses,
    trainingHistory,
    currentFocus,
    disconnect
  } = useStore();

  if (!account) {
    return (
      <div className="empty-state animate-slide-up">
        <User size={40} style={{ color: 'var(--text-tertiary)' }} />
        <h2 className="empty-state-title">No Profile Connected</h2>
        <p className="empty-state-desc">
          Connect your Chess.com or Lichess account to unlock your personalized weakness profile.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/connect')}>
          Connect Profile
        </button>
      </div>
    );
  }

  // Calculate training history stats
  const totalPractices = trainingHistory.length;
  const correctPractices = trainingHistory.filter(t => t.isCorrect).length;
  const practiceSuccessRate = totalPractices > 0 ? Math.round((correctPractices / totalPractices) * 100) : 0;

  // Find improving and needs practice areas across all categories
  const allThemes = [
    ...(weaknesses?.tactical || []),
    ...(weaknesses?.positional || []),
    ...(weaknesses?.strategic || []),
  ];

  const improvingAreas = allThemes.filter(t => t.status === 'Improving' || t.status === 'Strong');
  const needsPracticeAreas = allThemes.filter(t => t.status === 'Needs Practice');

  return (
    <div className="animate-slide-up" style={{ maxWidth: 1040, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="flex items-center gap-sm mb-xs">
            <span className={`platform-dot ${account.platform}`} />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
              {account.platform === 'chesscom' ? 'Chess.com' : 'Lichess'} Account
            </span>
          </div>
          <h1 className="page-title">{profile?.name || profile?.username || account.username}</h1>
          <p className="page-subtitle">
            Personalized Weakness Profile &amp; Adaptive Learning History • {games.length} Games Tracked
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={disconnect} style={{ gap: '6px' }}>
          <LogOut size={14} /> Disconnect Account
        </button>
      </div>

      {/* Progress Over Time KPI Banner */}
      <div className="stat-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="stat-card">
          <span className="stat-card-label">Games Analyzed</span>
          <span className="stat-card-value">{games.filter(g => g.analysis_status === 'complete').length}</span>
          <span className="stat-card-sub">Stockfish 19 deep scans</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Training Drills</span>
          <span className="stat-card-value" style={{ color: 'var(--accent-primary)' }}>{totalPractices}</span>
          <span className="stat-card-sub">Interactive puzzles solved</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Drill Accuracy</span>
          <span className="stat-card-value" style={{ color: 'var(--accent-success)' }}>
            {totalPractices > 0 ? `${practiceSuccessRate}%` : '—'}
          </span>
          <span className="stat-card-sub">{correctPractices} of {totalPractices} correct</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Mastered Areas</span>
          <span className="stat-card-value" style={{ color: 'var(--accent-secondary)' }}>
            {improvingAreas.length}
          </span>
          <span className="stat-card-sub">Themes improving/strong</span>
        </div>
      </div>

      {/* Current Improvement Focus Banner */}
      <div className="card-glass" style={{ marginBottom: 'var(--space-xl)', borderLeft: '4px solid var(--accent-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Current Improvement Focus
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>
              {currentFocus || 'Tactical Fork Recognition & Pawn Structure Decisions'}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Dynamically derived from recurring evaluation drops across your match history and refined through completed drills.
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => navigate('/training')} style={{ gap: '6px' }}>
            <Target size={16} /> Practice Current Focus
          </button>
        </div>
      </div>

      {/* Weakness Breakdown Grid: Tactical, Positional, Strategic */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Layers size={20} style={{ color: 'var(--accent-primary)' }} />
        <span>Weakness Intelligence Breakdown</span>
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        
        {/* Tactical Weaknesses */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} style={{ color: 'var(--tactical-color)' }} />
              Tactical Themes
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(weaknesses?.tactical || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {item.errorsCount || 0} mistake(s) • {item.practiceCount || 0} drill(s)
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: item.color }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Positional Weaknesses */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--positional-color)' }} />
              Positional Themes
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(weaknesses?.positional || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {item.errorsCount || 0} mistake(s) • {item.practiceCount || 0} drill(s)
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: item.color }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Weaknesses */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: 'var(--strategic-color)' }} />
              Strategic Planning
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(weaknesses?.strategic || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {item.errorsCount || 0} mistake(s) • {item.practiceCount || 0} drill(s)
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: item.color }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Sprint 4 Deliverable: Training History Section */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} style={{ color: 'var(--accent-primary)' }} />
            Training History &amp; Drill Results ({trainingHistory.length})
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/training')}>
            Add Practice Drill <ChevronRight size={14} />
          </button>
        </div>

        {trainingHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '0.9rem' }}>No practice drills completed yet.</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/training')} style={{ marginTop: '12px' }}>
              Solve Your First Drill
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {trainingHistory.slice(0, 8).map((record) => {
              const formattedTime = new Date(record.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={record.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {record.isCorrect ? (
                      <CheckCircle2 size={18} style={{ color: 'var(--accent-success)' }} />
                    ) : (
                      <XCircle size={18} style={{ color: 'var(--accent-danger)' }} />
                    )}
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{record.theme} Drill</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                        Played: <code>{record.playedSan}</code> • Solution: <code>{record.solutionSan}</code>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`badge badge-${record.isCorrect ? 'complete' : 'loss'}`}>
                      {record.isCorrect ? 'Correct' : 'Needs Review'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                      {formattedTime}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ratings summary from connected account */}
      {stats && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '14px' }}>Connected Account Ratings</h3>
          <div className="stat-grid">
            {Object.entries(stats).map(([key, val]) => (
              <div key={key} className="stat-card" style={{ padding: '14px' }}>
                <span className="stat-card-label">{key}</span>
                <span className="stat-card-value" style={{ fontSize: '1.4rem' }}>
                  {val.rating || 'Unrated'}
                </span>
                <span className="stat-card-sub">{val.wins} Games</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
