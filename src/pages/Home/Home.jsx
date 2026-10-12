import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../store/useAuth';
import {
  Link2,
  Target,
  GraduationCap,
  Zap,
  Brain,
  Sparkles,
  Play,
} from 'lucide-react';

export default function Home() {
  const { account, profile, stats, games, currentFocus, loadDemoAccount, trainingHistory, reviewQueue } = useStore();
  const dailyGoal = useAuth(s => s.settings.dailyGoal);
  const doneToday = trainingHistory.filter(t => new Date(t.date).toDateString() === new Date().toDateString()).length;
  const dueCount = reviewQueue.filter(q => q.dueAt <= Date.now()).length;
  const navigate = useNavigate();

  // If no account connected, show onboarding
  if (!account) {
    return <HomeOnboarding navigate={navigate} loadDemoAccount={loadDemoAccount} />;
  }

  const recentGame = games[0];
  const name = profile?.name || profile?.username || account.username;

  const mainRating = stats
    ? (stats.rapid?.rating || stats.blitz?.rating || stats.bullet?.rating || '—')
    : '—';

  return (
    <div className="home-minimal animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {name}</h1>
        <p className="page-subtitle">Here is your next step.</p>
      </div>

      <section className="home-next card" aria-labelledby="home-next-title">
        <div className="home-next-label">Today's focus</div>
        <h2 id="home-next-title" className="home-next-title">
          {currentFocus || 'Tactical fork recognition'}
        </h2>
        <div className="home-next-actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/training')}>
            <Play size={18} /> Start training
          </button>
          {recentGame && (
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate(`/analysis?id=${encodeURIComponent(recentGame.platform_game_id)}`)}
            >
              Review last game
            </button>
          )}
        </div>
      </section>

      <div className="home-glance" aria-label="At a glance">
        <div className="home-glance-item">
          <span className="home-glance-value">{mainRating}</span>
          <span className="home-glance-label">Rating</span>
        </div>
        <div className="home-glance-item">
          <span className="home-glance-value">{Math.min(doneToday, dailyGoal)}/{dailyGoal}</span>
          <span className="home-glance-label">Practice today</span>
        </div>
        <button className="home-glance-item home-glance-link" onClick={() => navigate('/training?tab=review')}>
          <span className="home-glance-value">{dueCount}</span>
          <span className="home-glance-label">Reviews due</span>
        </button>
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
        <div className="flex flex-col gap-md onboard-features" style={{ marginBottom: 'var(--space-xl)' }}>
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

        <div className="onboard-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
