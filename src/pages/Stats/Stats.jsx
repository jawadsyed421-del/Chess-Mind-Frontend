import React, { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';

function Bar({ label, value, max, color = 'var(--accent-primary)', right }) {
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track"><div className="bar-fill" style={{ width: `${max ? (value / max) * 100 : 0}%`, background: color }} /></div>
      <span className="bar-value">{right ?? value}</span>
    </div>
  );
}

function Trend({ points, color }) {
  if (points.length < 2) return <p className="text-muted" style={{ fontSize: '0.85rem' }}>Not enough games for a trend yet.</p>;
  const w = 320, h = 90;
  const min = Math.min(...points), max = Math.max(...points), span = max - min || 1;
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${(i / (points.length - 1)) * w},${h - ((p - min) / span) * (h - 10) - 5}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="trend">
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" />
    </svg>
  );
}

export default function Stats() {
  const { games, weaknesses } = useStore();
  const [platform, setPlatform] = useState('all');
  const [tc, setTc] = useState('all');

  const timeControls = useMemo(() => [...new Set(games.map(g => g.time_control).filter(Boolean))], [games]);
  const filtered = games.filter(g => (platform === 'all' || g.platform === platform) && (tc === 'all' || g.time_control === tc));

  const count = r => filtered.filter(g => g.result === r).length;
  const chrono = [...filtered].sort((a, b) => new Date(a.date_played) - new Date(b.date_played));
  const ratings = chrono.map(g => (g.player_color === 'white' ? g.white_rating : g.black_rating)).filter(Boolean);
  const accuracies = chrono.map(g => g.accuracy).filter(a => typeof a === 'number');

  const openings = Object.entries(
    filtered.reduce((acc, g) => {
      const k = g.opening_name || 'Unknown';
      acc[k] = acc[k] || { n: 0, w: 0 };
      acc[k].n++;
      if (g.result === 'win') acc[k].w++;
      return acc;
    }, {})
  ).sort((a, b) => b[1].n - a[1].n).slice(0, 6);

  const mistakeByType = ['tactical', 'positional', 'strategic'].map(t => ({
    t,
    n: (weaknesses[t] || []).reduce((s, i) => s + (i.errorsCount || 0), 0),
  }));
  const maxM = Math.max(1, ...mistakeByType.map(m => m.n));

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">Stats</h1>
        <p className="page-subtitle">Compare game performance by platform and time control</p>
      </div>

      <div className="card flex gap-md" style={{ flexWrap: 'wrap', marginBottom: 'var(--space-lg)' }}>
        <select className="input" style={{ maxWidth: 200 }} value={platform} onChange={e => setPlatform(e.target.value)}>
          <option value="all">All platforms</option>
          <option value="chesscom">Chess.com</option>
          <option value="lichess">Lichess</option>
        </select>
        <select className="input" style={{ maxWidth: 200 }} value={tc} onChange={e => setTc(e.target.value)}>
          <option value="all">All time controls</option>
          {timeControls.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><h3>No games match</h3><p className="text-secondary">Connect a profile or clear the filters.</p></div>
      ) : (
        <div className="stats-grid">
          <div className="card">
            <div className="card-title">Game results</div>
            <Bar label="Wins" value={count('win')} max={filtered.length} color="var(--accent-success)" />
            <Bar label="Draws" value={count('draw')} max={filtered.length} color="var(--accent-warning)" />
            <Bar label="Losses" value={count('loss')} max={filtered.length} color="var(--accent-danger)" />
          </div>
          <div className="card">
            <div className="card-title">Rating trend</div>
            <Trend points={ratings} color="var(--accent-primary)" />
          </div>
          <div className="card">
            <div className="card-title">Accuracy trend</div>
            {accuracies.length ? <Trend points={accuracies} color="var(--accent-secondary)" /> : <p className="text-muted" style={{ fontSize: '0.85rem' }}>Analyse games to see accuracy.</p>}
          </div>
          <div className="card">
            <div className="card-title">Openings</div>
            {openings.map(([name, o]) => (
              <Bar key={name} label={name} value={o.n} max={openings[0][1].n} right={`${o.n} · ${Math.round((o.w / o.n) * 100)}% wins`} />
            ))}
          </div>
          <div className="card">
            <div className="card-title">Mistakes by phase type</div>
            {mistakeByType.map(m => (
              <Bar key={m.t} label={m.t} value={m.n} max={maxM} color={`var(--${m.t}-color)`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
