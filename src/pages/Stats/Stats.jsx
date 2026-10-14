import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { useStore } from '../../store/useStore';
import { userStorage } from '../../store/userStorage';
import { cleanOpening, formatTimeControl, gameAccuracy, sanTarget } from '../../utils/gameInsights';

const RESULT_COLOR = { win: 'var(--accent-success)', draw: 'var(--text-tertiary)', loss: 'var(--accent-danger)' };
const FILES = 'abcdefgh';

function Bar({ label, value, max, color = 'var(--accent-primary)', right }) {
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track"><div className="bar-fill" style={{ width: `${max ? (value / max) * 100 : 0}%`, background: color }} /></div>
      <span className="bar-value">{right ?? value}</span>
    </div>
  );
}

function StatCard({ title, help, insight, wide, children }) {
  return (
    <div className={`card stats-card${wide ? ' stats-wide' : ''}`}>
      <div className="card-title">{title}</div>
      <p className="stats-help">{help}</p>
      {children}
      {insight && <p className="stats-insight">{insight}</p>}
    </div>
  );
}

const fmtDate = d => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

// Per-game accuracy dots coloured by result, with a rolling 10-game average line.
function AccuracyChart({ points, onOpen }) {
  const [hover, setHover] = useState(null);
  const W = 760, H = 260, L = 40, R = 12, T = 12, B = 28;
  const lo = Math.max(0, Math.floor((Math.min(...points.map(p => p.me)) - 5) / 10) * 10);
  const x = i => L + (points.length === 1 ? (W - L - R) / 2 : (i / (points.length - 1)) * (W - L - R));
  const y = v => T + ((100 - v) / (100 - lo)) * (H - T - B);
  const avg = points.map((_, i) => {
    const win = points.slice(Math.max(0, i - 9), i + 1);
    return win.reduce((s, p) => s + p.me, 0) / win.length;
  });
  const ticks = [];
  for (let v = lo; v <= 100; v += 10) ticks.push(v);
  const h = hover != null ? points[hover] : null;

  return (
    <div className="acc-chart">
      <div className="acc-legend">
        <span><i style={{ background: RESULT_COLOR.win }} /> Win</span>
        <span><i style={{ background: RESULT_COLOR.draw }} /> Draw</span>
        <span><i style={{ background: RESULT_COLOR.loss }} /> Loss</span>
        <span><b /> 10-game average</span>
      </div>
      <div className="acc-plot">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Accuracy per game">
          {ticks.map(v => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--border-subtle)" />
              <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--text-tertiary)">{v}</text>
            </g>
          ))}
          {/* With a single game there is nothing to connect, so the average runs flat across the chart. */}
          <path
            d={points.length === 1
              ? `M${L},${y(avg[0])} L${W - R},${y(avg[0])}`
              : avg.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')}
            fill="none" stroke="var(--text-secondary)" strokeWidth="2"
            strokeDasharray={points.length === 1 ? '6 5' : undefined}
          />
          {points.map((p, i) => (
            <g
              key={p.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onOpen(p.id)}
            >
              <circle cx={x(i)} cy={y(p.me)} r="14" fill="transparent" />
              <circle
                cx={x(i)} cy={y(p.me)} r={hover === i ? 8 : 5.5}
                fill={RESULT_COLOR[p.result] || RESULT_COLOR.draw}
                stroke={hover === i ? 'var(--bg-card)' : 'none'} strokeWidth="2"
              />
            </g>
          ))}
        </svg>
        {h && (
          <div
            className="acc-tip"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              top: `${(y(h.me) / H) * 100}%`,
              transform: `translate(${x(hover) > W * 0.7 ? 'calc(-100% - 12px)' : '12px'}, -50%)`,
            }}
          >
            <div className="acc-tip-head">
              <i style={{ background: RESULT_COLOR[h.result] }} />
              <strong style={{ textTransform: 'capitalize' }}>{h.result}</strong> · {fmtDate(h.date)}
            </div>
            <div className="acc-tip-row"><strong>{h.me.toFixed(1)}</strong> your accuracy</div>
            {h.opp != null && <div className="acc-tip-row"><strong>{h.opp.toFixed(1)}</strong> opponent</div>}
            <div className="acc-tip-foot">vs {h.opponent} · click to open the game</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Board heatmap: where your mistakes land, or where your pieces go.
function Heatmap({ games }) {
  const [mode, setMode] = useState('mistakes');
  const [hover, setHover] = useState(null);

  const data = useMemo(() => {
    const cells = {};
    const add = (sq, w, drop) => {
      if (!sq) return;
      const c = (cells[sq] = cells[sq] || { n: 0, w: 0, drop: 0 });
      c.n++; c.w += w; c.drop += drop || 0;
    };
    let source = 0;

    if (mode === 'mistakes') {
      for (const g of games) {
        const raw = userStorage.getItem(`chessmind_analysis_${g.platform_game_id}`);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          const mistakes = (parsed.analysis || parsed).mistakes || [];
          source++;
          mistakes.forEach(m => add(sanTarget(m.moveSan, m.color), Math.min(m.evalDrop || 1, 5), m.evalDrop));
        } catch { /* skip unreadable cache */ }
      }
    } else {
      for (const g of games) {
        if (!g.pgn) continue;
        try {
          const chess = new Chess();
          chess.loadPgn(g.pgn);
          const mine = g.player_color === 'black' ? 'b' : 'w';
          source++;
          chess.history({ verbose: true }).filter(m => m.color === mine).forEach(m => add(m.to, 1));
        } catch { /* skip unparsable PGN */ }
      }
    }
    const max = Math.max(0, ...Object.values(cells).map(c => c.w));
    const top = Object.entries(cells).sort((a, b) => b[1].w - a[1].w).slice(0, 3);
    return { cells, max, top, source };
  }, [games, mode]);

  const describe = sq => {
    const c = data.cells[sq];
    if (!c) return mode === 'mistakes' ? 'No mistakes on this square.' : 'You never moved a piece here.';
    return mode === 'mistakes'
      ? `${c.n} mistake${c.n > 1 ? 's' : ''} · average loss ${(c.drop / c.n).toFixed(1)} pawns`
      : `${c.n} move${c.n > 1 ? 's' : ''} landed here`;
  };

  return (
    <StatCard
      wide
      title="Board heatmap"
      help={mode === 'mistakes'
        ? 'Squares where your mistakes landed in analysed games. Redder squares cost you more points: the colour is weighted by how much each mistake dropped the engine evaluation.'
        : 'Squares your pieces moved to across these games. It shows which parts of the board you play on most, for example a kingside or queenside player.'}
    >
      <div className="heat-tabs">
        <button className={`btn btn-sm ${mode === 'mistakes' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('mistakes')}>Mistakes</button>
        <button className={`btn btn-sm ${mode === 'moves' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('moves')}>Piece activity</button>
      </div>

      {data.source === 0 ? (
        <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: 12 }}>
          {mode === 'mistakes' ? 'Analyse a game to start building your mistake map.' : 'No games with move data yet.'}
        </p>
      ) : (
        <div className="heat-wrap">
          <div className="heat-board-wrap">
            <div className="heat-ranks">{[8, 7, 6, 5, 4, 3, 2, 1].map(r => <span key={r}>{r}</span>)}</div>
            <div className="heat-board" onMouseLeave={() => setHover(null)}>
              {[8, 7, 6, 5, 4, 3, 2, 1].flatMap(rank => [...FILES].map((f, fi) => {
                const sq = `${f}${rank}`;
                const light = (fi + rank) % 2 === 1;
                const level = data.max ? (data.cells[sq]?.w || 0) / data.max : 0;
                return (
                  <div
                    key={sq}
                    className={`heat-sq ${light ? 'light' : 'dark'}${hover === sq ? ' active' : ''}`}
                    onMouseEnter={() => setHover(sq)}
                    title={`${sq}: ${describe(sq)}`}
                  >
                    <span style={{ opacity: level ? 0.15 + level * 0.75 : 0 }} />
                  </div>
                );
              }))}
            </div>
            <div className="heat-files">{[...FILES].map(f => <span key={f}>{f}</span>)}</div>
          </div>

          <div className="heat-side">
            <div className="heat-scale"><span>Fewer</span><i /><span>More</span></div>
            <div className="heat-detail">
              <div className="pf-stat-label">{hover ? `Square ${hover}` : 'Hover a square'}</div>
              <div>{hover ? describe(hover) : `Based on ${data.source} ${mode === 'mistakes' ? 'analysed ' : ''}game${data.source > 1 ? 's' : ''}.`}</div>
            </div>
            {data.top.length > 0 && (
              <div>
                <div className="pf-stat-label">{mode === 'mistakes' ? 'Problem squares' : 'Busiest squares'}</div>
                {data.top.map(([sq, c]) => (
                  <div key={sq} className="heat-top"><strong>{sq}</strong><span>{describe(sq)}</span></div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </StatCard>
  );
}

export default function Stats() {
  const navigate = useNavigate();
  const { games, weaknesses } = useStore();
  const [platform, setPlatform] = useState('all');
  const [tc, setTc] = useState('all');

  const timeControls = useMemo(() => [...new Set(games.map(g => g.time_control).filter(Boolean))], [games]);
  const filtered = games.filter(g => (platform === 'all' || g.platform === platform) && (tc === 'all' || g.time_control === tc));

  const count = r => filtered.filter(g => g.result === r).length;
  const winRate = filtered.length ? Math.round((count('win') / filtered.length) * 100) : 0;
  const chrono = [...filtered].sort((a, b) => new Date(a.date_played) - new Date(b.date_played));

  const accPoints = chrono
    .map(g => ({ g, acc: gameAccuracy(g) }))
    .filter(p => p.acc?.me != null)
    .map(({ g, acc }) => ({ id: g.platform_game_id, me: acc.me, opp: acc.opp, result: g.result, date: g.date_played, opponent: g.opponent }));
  const avgAcc = accPoints.length ? accPoints.reduce((s, p) => s + p.me, 0) / accPoints.length : null;
  const accBy = r => {
    const list = accPoints.filter(p => p.result === r);
    return list.length ? (list.reduce((s, p) => s + p.me, 0) / list.length).toFixed(1) : null;
  };

  const oppRatings = filtered.map(g => (g.player_color === 'white' ? g.black_rating : g.white_rating)).filter(Boolean);
  const avgOpp = oppRatings.length ? Math.round(oppRatings.reduce((s, n) => s + n, 0) / oppRatings.length) : null;

  const openings = Object.entries(
    filtered.reduce((acc, g) => {
      const k = cleanOpening(g.opening_name);
      acc[k] = acc[k] || { n: 0, w: 0 };
      acc[k].n++;
      if (g.result === 'win') acc[k].w++;
      return acc;
    }, {})
  ).sort((a, b) => b[1].n - a[1].n).slice(0, 6);
  const bestOpening = [...openings].filter(([, o]) => o.n >= 2).sort((a, b) => b[1].w / b[1].n - a[1].w / a[1].n)[0];

  const mistakeByType = ['tactical', 'positional', 'strategic'].map(t => ({
    t,
    n: (weaknesses[t] || []).reduce((s, i) => s + (i.errorsCount || 0), 0),
  }));
  const maxM = Math.max(1, ...mistakeByType.map(m => m.n));
  const topType = [...mistakeByType].sort((a, b) => b.n - a.n)[0];

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">Stats</h1>
        <p className="page-subtitle">How you are performing, where you lose points, and what to work on. Use the filters to compare platforms and time controls.</p>
      </div>

      <div className="card flex gap-md" style={{ flexWrap: 'wrap', marginBottom: 'var(--space-lg)' }}>
        <select className="input" style={{ maxWidth: 200 }} value={platform} onChange={e => setPlatform(e.target.value)}>
          <option value="all">All platforms</option>
          <option value="chesscom">Chess.com</option>
          <option value="lichess">Lichess</option>
        </select>
        <select className="input" style={{ maxWidth: 200 }} value={tc} onChange={e => setTc(e.target.value)}>
          <option value="all">All time controls</option>
          {timeControls.map(t => <option key={t} value={t}>{formatTimeControl(t, games.find(g => g.time_control === t)?.platform) || t}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><h3>No games match</h3><p className="text-secondary">Connect a profile or clear the filters.</p></div>
      ) : (
        <>
          <div className="stats-kpis">
            <div className="stats-kpi">
              <div className="pf-stat-label">Games</div>
              <div className="pf-stat-value">{filtered.length}</div>
              <div className="pf-stat-sub">Games in the current filter</div>
            </div>
            <div className="stats-kpi">
              <div className="pf-stat-label">Win rate</div>
              <div className="pf-stat-value">{winRate}%</div>
              <div className="pf-stat-sub">Share of these games you won</div>
            </div>
            <div className="stats-kpi">
              <div className="pf-stat-label">Average accuracy</div>
              <div className="pf-stat-value">{avgAcc != null ? avgAcc.toFixed(1) : '—'}</div>
              <div className="pf-stat-sub">How close your moves were to the engine's best (100 = perfect)</div>
            </div>
            <div className="stats-kpi">
              <div className="pf-stat-label">Average opponent</div>
              <div className="pf-stat-value">{avgOpp ?? '—'}</div>
              <div className="pf-stat-sub">Typical rating of the players you face</div>
            </div>
          </div>

          <div className="stats-grid">
            <StatCard
              wide
              title="Accuracy per game"
              help="Each dot is one game, coloured by the result. Higher is better: 90+ is very clean play, below 70 usually means a serious blunder. The line is your average over the last 10 games, so you can see if you are getting more consistent. Hover a dot for details and click it to open the game."
              insight={accPoints.length
                ? `Average accuracy ${accBy('win') ? `in wins ${accBy('win')}` : ''}${accBy('win') && accBy('loss') ? ' vs ' : ''}${accBy('loss') ? `in losses ${accBy('loss')}` : ''}. ${accPoints.length} of ${filtered.length} games have an accuracy score.`
                : null}
            >
              {accPoints.length ? (
                <AccuracyChart points={accPoints} onOpen={id => navigate(`/analysis?id=${encodeURIComponent(id)}`)} />
              ) : (
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                  No accuracy yet. Analyse games here, or use Sync New Games to pull accuracy from games you reviewed on Chess.com or Lichess.
                </p>
              )}
            </StatCard>

            <Heatmap games={filtered} />

            <StatCard
              title="Game results"
              help="How your games ended. A high draw count can mean safe play; many losses point to mistakes worth reviewing."
              insight={`You won ${count('win')}, drew ${count('draw')} and lost ${count('loss')} of ${filtered.length} games.`}
            >
              <Bar label="Wins" value={count('win')} max={filtered.length} color="var(--accent-success)" />
              <Bar label="Draws" value={count('draw')} max={filtered.length} color="var(--accent-warning)" />
              <Bar label="Losses" value={count('loss')} max={filtered.length} color="var(--accent-danger)" />
            </StatCard>

            <StatCard
              title="Openings"
              help="Your most played openings, with how often each one wins. Keep openings that score well; study the ones that don't."
              insight={bestOpening ? `Best scoring: ${bestOpening[0]} (${Math.round((bestOpening[1].w / bestOpening[1].n) * 100)}% wins).` : null}
            >
              {openings.map(([name, o]) => (
                <Bar key={name} label={name} value={o.n} max={openings[0][1].n} right={`${o.n} · ${Math.round((o.w / o.n) * 100)}% wins`} />
              ))}
            </StatCard>

            <StatCard
              title="Mistakes by type"
              help="Mistakes found by Stockfish, grouped by size. Tactical: lost more than 2 pawns. Positional: 1 to 2 pawns. Strategic: 0.4 to 1 pawn."
              insight={topType.n ? `Most of your mistakes are ${topType.t}. That is the area to train first.` : 'Analyse games to see your mistake types.'}
            >
              {mistakeByType.map(m => (
                <Bar key={m.t} label={m.t} value={m.n} max={maxM} color={`var(--${m.t}-color)`} />
              ))}
            </StatCard>
          </div>
        </>
      )}
    </div>
  );
}
