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
  Play,
  ChevronRight,
} from 'lucide-react';
import { performanceOverview, playStyle, recommendations, platformName } from '../../utils/gameInsights';

export default function Home() {
  const { account, profile, stats, games, weaknesses, currentFocus, loadDemoAccount, trainingHistory, reviewQueue } = useStore();
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

      {games.length > 0 && <HomeInsights games={games} weaknesses={weaknesses} navigate={navigate} />}
    </div>
  );
}

function HomeInsights({ games, weaknesses, navigate }) {
  const perf = performanceOverview(games);
  const style = playStyle(perf.recent);
  const recs = recommendations(games, weaknesses);
  const { all } = perf;
  const pct = n => (all.n ? (n / all.n) * 100 : 0);

  return (
    <>
      <section className="home-section">
        <div className="home-section-head">
          <h2>Performance overview</h2>
          <span>Last {all.n} games</span>
        </div>
        <div className="home-perf card">
          <div className="home-perf-main">
            <div>
              <div className="home-perf-big">{all.winRate}%</div>
              <div className="home-glance-label">Win rate</div>
            </div>
            <div>
              <div className="home-perf-big">
                {perf.ratingChange > 0 ? '+' : ''}{perf.ratingChange}
              </div>
              <div className="home-glance-label">Rating change</div>
            </div>
            <div>
              <div className="home-perf-big">{all.w}/{all.l}/{all.d}</div>
              <div className="home-glance-label">Won / lost / drawn</div>
            </div>
          </div>
          <div className="home-wld" role="img" aria-label={`${all.w} wins, ${all.l} losses, ${all.d} draws`}>
            <span style={{ width: `${pct(all.w)}%`, background: 'var(--accent-success)' }} />
            <span style={{ width: `${pct(all.d)}%`, background: 'var(--text-muted)' }} />
            <span style={{ width: `${pct(all.l)}%`, background: 'var(--accent-danger)' }} />
          </div>
          <div className="home-perf-split">
            <div><span className="home-colour white" /> As White: <strong>{perf.white.winRate}%</strong> wins in {perf.white.n}</div>
            <div><span className="home-colour black" /> As Black: <strong>{perf.black.winRate}%</strong> wins in {perf.black.n}</div>
            <div className="home-form" aria-label="Recent form">
              {perf.form.map((r, i) => <span key={i} className={`home-form-dot ${r}`} title={r}>{r[0].toUpperCase()}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head"><h2>Play style</h2></div>
        <div className="card home-style">
          <div className="home-style-label">{style.label}</div>
          <p className="home-style-desc">{style.desc}</p>
          <div className="home-style-facts">
            {style.avgMoves && <Fact label="Average game" value={`${style.avgMoves} moves`} />}
            {style.favouriteFirstMove && <Fact label="First move as White" value={`1. ${style.favouriteFirstMove}`} />}
            {style.whiteOpening && <Fact label="Main opening as White" value={style.whiteOpening} />}
            {style.blackOpening && <Fact label="Main opening as Black" value={style.blackOpening} />}
            {style.timeControl && <Fact label="Most played time control" value={style.timeControl} />}
          </div>
        </div>
      </section>

      {recs.length > 0 && (
        <section className="home-section">
          <div className="home-section-head"><h2>Recommendations</h2></div>
          <div className="home-recs">
            {recs.map(r => (
              <div key={r.title} className="card home-rec">
                <h3>{r.title}</h3>
                <p>{r.body}</p>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(r.to)}>
                  {r.cta} <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="home-section">
        <div className="home-section-head">
          <h2>Recent games</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/games')}>View all <ChevronRight size={14} /></button>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {perf.recent.slice(0, 5).map(g => (
            <div
              key={g.platform_game_id}
              className="game-list-item"
              onClick={() => navigate(`/analysis?id=${encodeURIComponent(g.platform_game_id)}`)}
            >
              <div className={`game-color-indicator ${g.player_color}`} title={`Played as ${g.player_color}`} />
              <div className="game-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="game-opponent">vs {g.opponent}</span>
                  <span className={`badge badge-${g.result}`}>{g.result}</span>
                </div>
                <div className="game-opening">{platformName(g.platform)}</div>
              </div>
              <div className="game-date">
                {g.date_played ? new Date(g.date_played).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
              </div>
              <ChevronRight size={18} style={{ color: 'var(--accent-primary)' }} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Fact({ label, value }) {
  return (
    <div className="home-fact">
      <span className="home-glance-label">{label}</span>
      <strong>{value}</strong>
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
            Explore Interactive Demo (Instant Access)
          </button>
        </div>
      </div>
    </div>
  );
}
