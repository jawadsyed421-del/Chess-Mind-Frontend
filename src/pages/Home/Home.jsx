import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import {
  Link2,
  Gamepad2,
  BarChart3,
  Target,
  GraduationCap,
  TrendingUp,
  ChevronRight,
  Zap,
  Brain,
  Trophy,
  ArrowRight,
  Sparkles,
  Lightbulb,
  Play
} from 'lucide-react';

export default function Home() {
  const { account, profile, stats, games, currentFocus, loadDemoAccount } = useStore();
  const navigate = useNavigate();

  // If no account connected, show onboarding
  if (!account) {
    return <HomeOnboarding navigate={navigate} loadDemoAccount={loadDemoAccount} />;
  }

  const wins = games.filter(g => g.result === 'win').length;
  const losses = games.filter(g => g.result === 'loss').length;
  const draws = games.filter(g => g.result === 'draw').length;
  const recentGame = games[0];
  const analyzedGames = games.filter(g => g.analysis_status === 'complete').length;

  const mainRating = stats
    ? (stats.rapid?.rating || stats.blitz?.rating || stats.bullet?.rating || '—')
    : '—';

  return (
    <div className="animate-slide-up">
      {/* Welcome Header */}
      <div className="page-header">
        <div className="flex items-center gap-md mb-md">
          <div className="platform-tag">
            <span className={`platform-dot ${account.platform}`} />
            {account.platform === 'chesscom' ? 'Chess.com' : 'Lichess'}
          </div>
        </div>
        <h1 className="page-title">Welcome back, {profile?.name || profile?.username || account.username}</h1>
        <p className="page-subtitle">Your personalized chess improvement dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="stat-grid stagger" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="stat-card">
          <span className="stat-card-label">Rating</span>
          <span className="stat-card-value" style={{ color: 'var(--accent-primary)' }}>{mainRating}</span>
          <span className="stat-card-sub">
            {stats?.rapid?.rating ? 'Rapid' : stats?.blitz?.rating ? 'Blitz' : 'Current'}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Games Imported</span>
          <span className="stat-card-value">{games.length}</span>
          <span className="stat-card-sub">from {account.platform === 'chesscom' ? 'Chess.com' : 'Lichess'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Win Rate</span>
          <span className="stat-card-value" style={{ color: 'var(--accent-success)' }}>
            {games.length ? `${Math.round((wins / games.length) * 100)}%` : '—'}
          </span>
          <span className="stat-card-sub">{wins}W / {losses}L / {draws}D</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Analysis</span>
          <span className="stat-card-value">{analyzedGames}</span>
          <span className="stat-card-sub">games analyzed</span>
        </div>
      </div>

      {/* Sprint 4 Home Core Feature Grid: Focus, Insight, Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        
        {/* 1. Current Improvement Focus */}
        <div className="card-glass" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} style={{ color: 'var(--accent-primary)' }} />
              Current Improvement Focus
            </span>
            <span className="badge badge-complete">Live Focus</span>
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '8px 0 4px' }}>
            {currentFocus || 'Tactical Fork Recognition & Pawn Structure Decisions'}
          </h3>
          <p className="text-secondary" style={{ fontSize: '0.88rem', lineHeight: 1.45 }}>
            Identified across recent game analysis where tactical inaccuracies and structural concessions created the biggest evaluation drops.
          </p>
          <div className="flex items-center gap-sm mt-md">
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/training')}>
              <Play size={14} /> Start Focused Training
            </button>
          </div>
        </div>

        {/* 2. Latest Insight */}
        <div className="card-glass" style={{ borderLeft: '4px solid var(--accent-secondary)' }}>
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={18} style={{ color: 'var(--accent-secondary)' }} />
              Latest Coaching Insight
            </span>
            <span className="badge badge-positional">Stockfish Intelligence</span>
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', marginTop: '8px', lineHeight: 1.5 }}>
            "In recent games you maintain solid opening parity, but evaluate knight outposts too late in the middlegame. Prioritize active squares before opening the center."
          </p>
          <div className="flex items-center gap-sm mt-md">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/analysis')}>
              <BarChart3 size={14} /> View Detailed Analysis
            </button>
          </div>
        </div>

      </div>

      {/* Sprint 4 Recommended Actions: Training, Recent Game, GM Study */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
        
        {/* Recommended Recent Game */}
        {recentGame && (
          <div className="card" onClick={() => navigate(`/analysis?id=${encodeURIComponent(recentGame.platform_game_id)}`)} style={{ cursor: 'pointer' }}>
            <div className="card-header">
              <span className="card-title">Recent Game to Review</span>
              <ChevronRight size={18} className="text-muted" />
            </div>
            <div className="flex items-center gap-md" style={{ marginTop: '4px' }}>
              <div className={`game-color-indicator ${recentGame.player_color}`} />
              <div>
                <div style={{ fontWeight: 600 }}>vs {recentGame.opponent}</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {recentGame.opening_name}
                </div>
              </div>
              <span className={`badge badge-${recentGame.result}`} style={{ marginLeft: 'auto' }}>
                {recentGame.result}
              </span>
            </div>
            <div className="flex items-center gap-sm mt-md" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
              Inspect Moves &amp; Mistakes <ArrowRight size={14} />
            </div>
          </div>
        )}

        {/* Recommended Grandmaster Study */}
        <div className="card" onClick={() => navigate('/grandmaster')} style={{ cursor: 'pointer' }}>
          <div className="card-header">
            <span className="card-title">Recommended GM Study</span>
            <GraduationCap size={18} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Fischer vs Spassky (1972)</div>
          <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            Matched to your current pawn structure weaknesses. See how Fischer handles the dark-square blockade.
          </p>
          <div className="flex items-center gap-sm mt-md" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
            Start Interactive Study <ArrowRight size={14} />
          </div>
        </div>

        {/* Recommended Training Position */}
        <div className="card" onClick={() => navigate('/training')} style={{ cursor: 'pointer' }}>
          <div className="card-header">
            <span className="card-title">Personalized Exercises</span>
            <Sparkles size={18} style={{ color: 'var(--accent-warning)' }} />
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Tactical Fork Mastery</div>
          <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            3 positions tailored to your repeated double-attack oversights in blitz games.
          </p>
          <div className="flex items-center gap-sm mt-md" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
            Practice on Board <ArrowRight size={14} />
          </div>
        </div>

      </div>
    </div>
  );
}

function HomeOnboarding({ navigate, loadDemoAccount }) {
  return (
    <div className="connect-page">
      <div className="connect-container animate-slide-up">
        <div className="connect-hero">
          <div className="connect-hero-icon">♟</div>
          <h1>Welcome to ChessMind</h1>
          <p>Your personalized chess improvement engine. Connect your chess profile or explore demo games right away.</p>
        </div>

        {/* Feature cards */}
        <div className="flex flex-col gap-md" style={{ marginBottom: 'var(--space-xl)' }}>
          {[
            { icon: Brain, title: 'Analyze Your Games', desc: 'Stockfish 19 engine detects strategic, positional & tactical errors' },
            { icon: Zap, title: 'Find Your Weaknesses', desc: 'Detailed theme detection across forks, pins, and pawn structures' },
            { icon: Target, title: 'Personalized Training', desc: 'Practice your exact mistake positions and similar themes' },
            { icon: GraduationCap, title: 'Grandmaster Study', desc: 'Learn how champions solved the same dilemmas interactively' },
          ].map((f, i) => (
            <div key={i} className="card flex items-center gap-lg" style={{ animationDelay: `${i * 80}ms` }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent-primary)', flexShrink: 0,
              }}>
                <f.icon size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{f.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="btn btn-primary btn-lg w-full" onClick={() => navigate('/connect')}>
            <Link2 size={20} />
            Connect Your Chess Profile
          </button>

          <button
            className="btn btn-secondary btn-lg w-full"
            onClick={() => {
              loadDemoAccount();
              navigate('/games');
            }}
          >
            <Sparkles size={18} />
            Explore Interactive Demo (Instant Access)
          </button>
        </div>
      </div>
    </div>
  );
}
