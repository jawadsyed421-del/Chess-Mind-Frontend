import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { useStore } from '../../store/useStore';
import { userStorage } from '../../store/userStorage';
import { cleanOpening, gameAccuracy, sanTarget } from '../../utils/gameInsights';
import { InfoButton, InfoPanel, useInfo } from '../../components/InfoToggle/InfoToggle';

const RESULT_COLOR = { win: 'var(--accent-success)', draw: 'var(--text-tertiary)', loss: 'var(--accent-danger)' };
const TYPE_COLOR = { tactical: 'var(--tactical-color)', positional: 'var(--positional-color)', strategic: 'var(--strategic-color)' };
const FILES = 'abcdefgh';
const DAY = 86400000;

const fmtDate = d => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const fmtShort = d => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const myRating = g => (g.player_color === 'white' ? g.white_rating : g.black_rating);
const oppRating = g => (g.player_color === 'white' ? g.black_rating : g.white_rating);
const signed = (n, digits = 0) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(digits)}`;

// Chess.com sends seconds ("300", "180+2", "1/86400"); Lichess sends minutes ("5+3").
function timeClass(g) {
  const tc = String(g.time_control || '');
  if (tc.includes('/')) return 'Daily';
  const m = tc.match(/^(\d+(?:\.\d+)?)(?:\+(\d+))?$/);
  if (!m) return null;
  const base = g.platform === 'lichess' ? Number(m[1]) * 60 : Number(m[1]);
  const est = base + 40 * Number(m[2] || 0);
  if (est < 180) return 'Bullet';
  if (est < 600) return 'Blitz';
  return 'Rapid';
}

const score = list => (list.length ? (list.filter(g => g.result === 'win').length + list.filter(g => g.result === 'draw').length / 2) / list.length : null);
const avg = list => (list.length ? list.reduce((s, n) => s + n, 0) / list.length : null);
const eco = g => (g.pgn || '').match(/\[ECO "([A-E]\d\d)"\]/)?.[1] || '';

function readMistakes(g) {
  const raw = userStorage.getItem(`chessmind_analysis_${g.platform_game_id}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return (parsed.analysis || parsed).mistakes || [];
  } catch { return null; }
}

// Green / grey / red proportions of a set of games.
function ResultBar({ list, height = 6 }) {
  const n = list.length || 1;
  const pct = r => (list.filter(g => g.result === r).length / n) * 100;
  return (
    <div className="st-resbar" style={{ height }}>
      <span style={{ width: `${pct('win')}%`, background: RESULT_COLOR.win }} />
      <span style={{ width: `${pct('draw')}%`, background: 'var(--border-default)' }} />
      <span style={{ width: `${pct('loss')}%`, background: RESULT_COLOR.loss }} />
    </div>
  );
}

const PLATFORM_LABEL = { All: 'All', chesscom: 'Chess.com', lichess: 'Lichess' };

function Segmented({ options, value, onChange, small }) {
  return (
    <div className={`st-seg${small ? ' small' : ''}`}>
      {options.map(o => (
        <button key={o} className={value === o ? 'on' : ''} onClick={() => onChange(o)}>{PLATFORM_LABEL[o] || o}</button>
      ))}
    </div>
  );
}

// `sub` is always visible; `info` is extra detail revealed by the eye button.
function Card({ title, sub, info, right, className = '', children }) {
  const [open, toggle] = useInfo();
  return (
    <section className={`card st-card ${className}`}>
      <div className="st-card-head">
        <div>
          <h2 className="st-card-title">{title}</h2>
          {sub && <p className="st-card-sub">{sub}</p>}
        </div>
        {(right || info) && (
          <div className="st-card-actions">
            {right}
            {info && <InfoButton open={open} onToggle={toggle} label="details" />}
          </div>
        )}
      </div>
      {info && <InfoPanel open={open}>{info}</InfoPanel>}
      {children}
    </section>
  );
}

function DataTable({ head, rows }) {
  return (
    <div className="st-table-scroll">
      <table className="st-table">
        <thead><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

const TableToggle = ({ on, setOn }) => (
  <button className="st-link" onClick={() => setOn(!on)}>{on ? 'Show as chart' : 'Show as table'}</button>
);

// Rating history for one time class as a filled line.
function RatingChart({ games }) {
  const classes = useMemo(() => ['Blitz', 'Rapid', 'Daily', 'Bullet'].filter(c => games.some(g => timeClass(g) === c && myRating(g))), [games]);
  const [pick, setPick] = useState(null);
  const cls = classes.includes(pick) ? pick : (classes.includes('Rapid') ? 'Rapid' : classes[0]);
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState(null);

  const pts = useMemo(() => games
    .filter(g => timeClass(g) === cls && myRating(g))
    .sort((a, b) => new Date(a.date_played) - new Date(b.date_played))
    .map(g => ({ r: myRating(g), d: g.date_played })), [games, cls]);

  const right = classes.length > 1 && <Segmented small options={classes} value={cls} onChange={setPick} />;
  if (!pts.length) {
    return <Card title="Rating over time" right={right}><p className="st-empty">No rating history yet for these games.</p></Card>;
  }

  const W = 600, H = 220, L = 38, R = 8, T = 10, B = 24;
  const rs = pts.map(p => p.r);
  const peak = Math.max(...rs);
  const step = Math.max(5, Math.ceil((Math.max(...rs) - Math.min(...rs)) / 3 / 5) * 5);
  const lo = Math.floor(Math.min(...rs) / step) * step;
  const hi = Math.max(Math.ceil(Math.max(...rs) / step) * step, lo + step);
  const x = i => L + (pts.length === 1 ? (W - L - R) / 2 : (i / (pts.length - 1)) * (W - L - R));
  const y = v => T + ((hi - v) / (hi - lo)) * (H - T - B);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.r)}`).join(' ');
  const area = `${line} L${x(pts.length - 1)},${H - B} L${x(0)},${H - B} Z`;
  const ticks = []; for (let v = lo; v <= hi; v += step) ticks.push(v);
  const xt = pts.length === 1 ? [0] : [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * (pts.length - 1)));
  const change = pts[pts.length - 1].r - pts[0].r;
  const h = hover != null ? pts[hover] : null;

  const onMove = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    pts.forEach((_, i) => { if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i; });
    setHover(best);
  };

  return (
    <Card
      title="Rating over time"
      right={right}
      info="Your rating after each game in this time control, taken from the games you imported. Hover the line to see the rating on a given day. The change is measured from your first game shown to the latest."
    >
      <div className="st-eyebrow">Current rating</div>
      <div className="st-big">{pts[pts.length - 1].r}</div>
      <div className="st-meta-row">
        <span className={change < 0 ? 'neg' : change > 0 ? 'pos' : ''}>{signed(change)}</span> since {fmtShort(pts[0].d)} · peak <b>{peak}</b> · {pts.length} games
        <span className="grow" />
        <TableToggle on={table} setOn={setTable} />
      </div>
      {table ? (
        <DataTable head={['Date', 'Rating']} rows={[...pts].reverse().slice(0, 12).map(p => [fmtDate(p.d), p.r])} />
      ) : (
        <div className="acc-plot">
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${cls} rating over time`} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
            <defs>
              <linearGradient id="ratingFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--accent-success)" stopOpacity="0.28" />
                <stop offset="1" stopColor="var(--accent-success)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {ticks.map(v => (
              <g key={v}>
                <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--border-subtle)" />
                <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--text-tertiary)" fontFamily="var(--font-mono, monospace)">{v}</text>
              </g>
            ))}
            {pts.length > 1 && <path d={area} fill="url(#ratingFill)" />}
            <path d={line} fill="none" stroke="var(--accent-success)" strokeWidth="2" strokeLinejoin="round" />
            {pts.length === 1 && <circle cx={x(0)} cy={y(pts[0].r)} r="4" fill="var(--accent-success)" />}
            {xt.map(i => (
              <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 && pts.length > 1 ? 'start' : i === pts.length - 1 && pts.length > 1 ? 'end' : 'middle'} fontSize="11" fill="var(--text-tertiary)">{fmtShort(pts[i].d)}</text>
            ))}
            {h && <circle cx={x(hover)} cy={y(h.r)} r="5" fill="var(--accent-success)" stroke="var(--bg-card)" strokeWidth="2" />}
          </svg>
          {h && (
            <div className="acc-tip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(h.r) / H) * 100}%`, transform: `translate(${x(hover) > W * 0.7 ? 'calc(-100% - 12px)' : '12px'}, -50%)` }}>
              <div className="acc-tip-row"><strong>{h.r}</strong> rating</div>
              <div className="acc-tip-foot">{fmtDate(h.d)}</div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// Per-game accuracy dots coloured by result, with a rolling 10-game average line.
function AccuracyChart({ points, onOpen, average, oppAverage }) {
  const [hover, setHover] = useState(null);
  const [table, setTable] = useState(false);
  const W = 600, H = 220, L = 38, R = 8, T = 10, B = 24;
  const lo = Math.max(0, Math.floor((Math.min(...points.map(p => p.me)) - 5) / 10) * 10);
  const x = i => L + (points.length === 1 ? (W - L - R) / 2 : (i / (points.length - 1)) * (W - L - R));
  const y = v => T + ((100 - v) / (100 - lo)) * (H - T - B);
  const rolling = points.map((_, i) => avg(points.slice(Math.max(0, i - 9), i + 1).map(p => p.me)));
  const ticks = [];
  for (let v = lo; v <= 100; v += 10) ticks.push(v);
  const xt = points.length === 1 ? [0] : [0, points.length - 1];
  const h = hover != null ? points[hover] : null;

  return (
    <Card
      title="Accuracy trend"
      right={<span className="st-note">Last {points.length} analysed games</span>}
      info="Each dot is one game, coloured by the result. 100 means every move matched the engine; 90+ is very clean play and below 70 usually means a serious blunder. The line is your average over the last 10 games. Hover a dot for details and click it to open the game."
    >
      <div className="st-eyebrow">Average accuracy</div>
      <div className="st-big">{average.toFixed(1)}</div>
      <div className="st-meta-row">
        {oppAverage != null && <>opponents averaged <b>{oppAverage.toFixed(1)}</b></>}
        <span className="grow" />
        <TableToggle on={table} setOn={setTable} />
      </div>
      {table ? (
        <DataTable head={['Date', 'Result', 'You', 'Opponent']} rows={[...points].reverse().slice(0, 12).map(p => [fmtDate(p.date), p.result, p.me.toFixed(1), p.opp != null ? p.opp.toFixed(1) : '—'])} />
      ) : (
        <>
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
                  <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--text-tertiary)" fontFamily="var(--font-mono, monospace)">{v}</text>
                </g>
              ))}
              <path
                d={points.length === 1
                  ? `M${L},${y(rolling[0])} L${W - R},${y(rolling[0])}`
                  : rolling.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')}
                fill="none" stroke="var(--text-secondary)" strokeWidth="1.8"
                strokeDasharray={points.length === 1 ? '6 5' : undefined}
              />
              {points.map((p, i) => (
                <g key={p.id} style={{ cursor: 'pointer' }} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => onOpen(p.id)}>
                  <circle cx={x(i)} cy={y(p.me)} r="12" fill="transparent" />
                  <circle cx={x(i)} cy={y(p.me)} r={hover === i ? 6.5 : 3.5} fill={RESULT_COLOR[p.result] || RESULT_COLOR.draw} stroke={hover === i ? 'var(--bg-card)' : 'none'} strokeWidth="2" />
                </g>
              ))}
              {xt.map(i => (
                <text key={i} x={x(i)} y={H - 6} textAnchor={points.length === 1 ? 'middle' : i === 0 ? 'start' : 'end'} fontSize="11" fill="var(--text-tertiary)">{fmtShort(points[i].date)}</text>
              ))}
            </svg>
            {h && (
              <div className="acc-tip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(h.me) / H) * 100}%`, transform: `translate(${x(hover) > W * 0.7 ? 'calc(-100% - 12px)' : '12px'}, -50%)` }}>
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
        </>
      )}
    </Card>
  );
}

// Board heatmap: where your mistakes land, or where your pieces go.
function Heatmap({ games }) {
  const [mode, setMode] = useState('Mistakes');
  const [hover, setHover] = useState(null);
  const mistakesMode = mode === 'Mistakes';

  const data = useMemo(() => {
    const cells = {};
    const add = (sq, w, drop) => {
      if (!sq) return;
      const c = (cells[sq] = cells[sq] || { n: 0, w: 0, drop: 0 });
      c.n++; c.w += w; c.drop += drop || 0;
    };
    let source = 0;

    if (mistakesMode) {
      for (const g of games) {
        const mistakes = readMistakes(g);
        if (!mistakes) continue;
        source++;
        mistakes.forEach(m => add(sanTarget(m.moveSan, m.color), Math.min(m.evalDrop || 1, 5), m.evalDrop));
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
  }, [games, mistakesMode]);

  const describe = sq => {
    const c = data.cells[sq];
    if (!c) return mistakesMode ? 'No mistakes on this square.' : 'You never moved a piece here.';
    return mistakesMode
      ? `${c.n} mistake${c.n > 1 ? 's' : ''} · average loss ${(c.drop / c.n).toFixed(1)} pawns`
      : `${c.n} move${c.n > 1 ? 's' : ''} landed here`;
  };

  const topNames = data.top.map(([sq]) => sq);
  const sub = data.source === 0 ? null : (mistakesMode
    ? `Most of your mistakes land on ${topNames.length > 1 ? `${topNames.slice(0, -1).map(s => s).join(', ')} and ${topNames[topNames.length - 1]}` : topNames[0]}. Squares are weighted by how much each cost you.`
    : `Squares your pieces moved to most often: ${topNames.join(', ')}.`);

  return (
    <Card
      title={mistakesMode ? 'Where your mistakes happen' : 'Where your pieces go'}
      info={sub}
      right={<Segmented small options={['Mistakes', 'Piece activity']} value={mode} onChange={setMode} />}
    >
      {data.source === 0 ? (
        <p className="st-empty">{mistakesMode ? 'Analyse a game to start building your mistake map.' : 'No games with move data yet.'}</p>
      ) : (
        <>
          <div className="heat-board-wrap st-heat">
            <div className="heat-ranks">{[8, 7, 6, 5, 4, 3, 2, 1].map(r => <span key={r}>{r}</span>)}</div>
            <div className="heat-board" onMouseLeave={() => setHover(null)}>
              {[8, 7, 6, 5, 4, 3, 2, 1].flatMap(rank => [...FILES].map((f, fi) => {
                const sq = `${f}${rank}`;
                const light = (fi + rank) % 2 === 1;
                const level = data.max ? (data.cells[sq]?.w || 0) / data.max : 0;
                return (
                  <div key={sq} className={`heat-sq ${light ? 'light' : 'dark'}${hover === sq ? ' active' : ''}`} onMouseEnter={() => setHover(sq)} onClick={() => setHover(sq)} title={`${sq}: ${describe(sq)}`}>
                    <span style={{ opacity: level ? 0.15 + level * 0.75 : 0 }} />
                  </div>
                );
              }))}
            </div>
            <div className="heat-files">{[...FILES].map(f => <span key={f}>{f}</span>)}</div>
          </div>
          <div className="st-heat-foot">
            <span className="st-note">{hover ? `${hover}: ${describe(hover)}` : 'Tap or hover a square'}</span>
            <div className="heat-scale"><span>Fewer</span><i /><span>More</span></div>
          </div>
        </>
      )}
    </Card>
  );
}

function KpiStrip({ games, accPoints, thisWeekAcc, lastWeekAcc, onOpen }) {
  const w = games.filter(g => g.result === 'win').length;
  const d = games.filter(g => g.result === 'draw').length;
  const l = games.filter(g => g.result === 'loss').length;
  const sc = score(games);
  const opp = avg(games.map(oppRating).filter(Boolean));
  const accAll = avg(accPoints.map(p => p.me));
  const best = games.filter(g => g.result === 'win' && oppRating(g)).sort((a, b) => oppRating(b) - oppRating(a))[0];
  const accDelta = thisWeekAcc != null && lastWeekAcc != null ? thisWeekAcc - lastWeekAcc : null;

  return (
    <div className="card st-kpis">
      <div className="st-kpi">
        <div className="st-eyebrow">Games</div>
        <div className="st-kpi-val">{games.length}</div>
        <ResultBar list={games} height={5} />
        <div className="st-kpi-sub mono">{w}W {d}D {l}L</div>
      </div>
      <div className="st-kpi">
        <div className="st-eyebrow">Score</div>
        <div className="st-kpi-val">{Math.round(sc * 100)}%</div>
        <div className="st-kpi-sub">{opp != null ? <>against <b className="mono">{Math.round(opp)}</b> average</> : 'wins plus half of draws'}</div>
      </div>
      <div className="st-kpi">
        <div className="st-eyebrow">Average accuracy</div>
        <div className="st-kpi-val">{accAll != null ? accAll.toFixed(1) : '—'}</div>
        <div className="st-kpi-sub">
          {thisWeekAcc != null
            ? <>this week <b className="mono">{thisWeekAcc.toFixed(1)}</b>{accDelta != null && <> <b className={`mono ${accDelta < 0 ? 'neg' : 'pos'}`}>{signed(accDelta, 1)}</b> vs last</>}</>
            : 'no games analysed this week'}
        </div>
      </div>
      <div className={`st-kpi${best ? ' clickable' : ''}`} onClick={best ? () => onOpen(best.platform_game_id) : undefined}>
        <div className="st-eyebrow">Best win {best && <span className="st-arrow">↗</span>}</div>
        <div className="st-kpi-val">{best ? oppRating(best) : '—'}</div>
        <div className="st-kpi-sub">{best ? <>beat <b className="mono">{best.opponent}</b> · {fmtShort(best.date_played)}</> : 'no wins with a rated opponent yet'}</div>
      </div>
    </div>
  );
}

function Breakdown({ games }) {
  const group = (keyFn, order) => {
    const map = {};
    games.forEach(g => { const k = keyFn(g); if (k) (map[k] = map[k] || []).push(g); });
    const keys = order ? order.filter(k => map[k]) : Object.keys(map).sort((a, b) => map[b].length - map[a].length);
    return keys.map(k => ({ k, list: map[k] }));
  };
  const byColour = group(g => (g.player_color === 'white' ? 'White' : g.player_color === 'black' ? 'Black' : null), ['White', 'Black']);
  const byTc = group(timeClass, ['Bullet', 'Blitz', 'Rapid', 'Daily']);
  const byTime = group(g => {
    const h = new Date(g.date_played).getHours();
    return h < 6 ? 'Night' : h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening';
  }, ['Morning', 'Afternoon', 'Evening', 'Night']);

  const Col = ({ title, rows }) => (
    <div className="st-bd-col">
      <div className="st-eyebrow">{title}</div>
      {rows.map(({ k, list }) => (
        <div key={k} className="st-bd-row">
          <span>{k}</span>
          <ResultBar list={list} />
          <span className="mono muted">{list.length}</span>
          <b className="mono">{Math.round(score(list) * 100)}%</b>
        </div>
      ))}
    </div>
  );

  return (
    <Card
      title="Results breakdown"
      className="st-full"
      info="Each bar shows wins (green), draws (grey) and losses (red) for that group. The percentage is your score: a win counts 1, a draw counts half. The number beside the bar is how many games are in the group."
    >
      <div className="st-bd">
        <Col title="By colour" rows={byColour} />
        <Col title="By time control" rows={byTc} />
        <Col title="By time of day" rows={byTime} />
      </div>
    </Card>
  );
}

function Openings({ games, onOpen }) {
  const [side, setSide] = useState('As White');
  const [all, setAll] = useState(false);
  const color = side === 'As White' ? 'white' : 'black';

  const rows = useMemo(() => {
    const map = {};
    games.filter(g => g.player_color === color).forEach(g => {
      const k = cleanOpening(g.opening_name);
      (map[k] = map[k] || []).push(g);
    });
    return Object.entries(map).map(([name, list]) => {
      const latest = [...list].sort((a, b) => new Date(b.date_played) - new Date(a.date_played))[0];
      const accs = list.map(gameAccuracy).filter(a => a?.me != null).map(a => a.me);
      const counts = list.map(readMistakes).filter(Boolean).map(m => m.length);
      return { name, list, latest, code: eco(latest), score: score(list), acc: avg(accs), mistakes: avg(counts) };
    }).sort((a, b) => b.list.length - a.list.length);
  }, [games, color]);

  const shown = all ? rows : rows.slice(0, 8);

  return (
    <Card
      title="Openings"
      info="Most played first, with mistakes per game. Score counts a win as 1 and a draw as half. Accuracy and mistakes only include games that have been analysed. Open a row to replay your latest game in that opening."
      right={<Segmented small options={['As White', 'As Black']} value={side} onChange={setSide} />}
    >
      {rows.length === 0 ? <p className="st-empty">No games {side.toLowerCase()} in this selection.</p> : (
        <>
          <div className="st-op-head">
            <span>Opening</span><span className="r">Games</span><span>Results</span><span className="r">Score</span><span className="r hide-sm">Accuracy</span><span className="r hide-sm">Mistakes</span><span />
          </div>
          {shown.map(r => (
            <button key={r.name} className="st-op-row" onClick={() => onOpen(r.latest.platform_game_id)}>
              <span className="st-op-name"><b>{r.name}</b>{r.code && <small className="mono">{r.code}</small>}</span>
              <span className="r mono">{r.list.length}</span>
              <ResultBar list={r.list} />
              <b className="r mono">{Math.round(r.score * 100)}%</b>
              <span className="r mono hide-sm">{r.acc != null ? r.acc.toFixed(1) : '—'}</span>
              <span className="r mono hide-sm">{r.mistakes != null ? r.mistakes.toFixed(1) : '—'}</span>
              <span className="st-chev">›</span>
            </button>
          ))}
          {rows.length > 8 && (
            <button className="st-more" onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show all ${rows.length} openings`} <span>{all ? '⌃' : '⌄'}</span></button>
          )}
        </>
      )}
    </Card>
  );
}

function ThisWeek({ games }) {
  const now = Date.now();
  const cur = games.filter(g => now - new Date(g.date_played) <= 7 * DAY);
  const prev = games.filter(g => { const a = now - new Date(g.date_played); return a > 7 * DAY && a <= 14 * DAY; });
  const accOf = list => avg(list.map(gameAccuracy).filter(a => a?.me != null).map(a => a.me));
  const oppOf = list => avg(list.map(oppRating).filter(Boolean));
  const scoreOf = list => (list.length ? score(list) * 100 : null);

  const fmt = (v, d = 0, suffix = '') => (v == null ? '—' : `${v.toFixed(d)}${suffix}`);
  const delta = (a, b, d = 0, suffix = '') => (a == null || b == null ? '—' : <span className={a - b < 0 ? 'neg' : a - b > 0 ? 'pos' : ''}>{signed(a - b, d)}{suffix}</span>);
  const rows = [
    ['Games', cur.length, prev.length, <b className="mono">{cur.length}</b>, <span className="mono">{prev.length}</span>, <span className="mono">{signed(cur.length - prev.length)}</span>],
    ['Results', null, null, cur.length ? <ResultBar list={cur} height={6} /> : <span className="muted">—</span>, prev.length ? <ResultBar list={prev} height={6} /> : <span className="muted">—</span>, null],
    ['Score', 0, 0, <b className="mono">{fmt(scoreOf(cur), 0, '%')}</b>, <span className="mono">{fmt(scoreOf(prev), 0, '%')}</span>, <span className="mono">{delta(scoreOf(cur), scoreOf(prev), 0, ' pts')}</span>],
    ['Accuracy', 0, 0, <b className="mono">{fmt(accOf(cur), 1)}</b>, <span className="mono">{fmt(accOf(prev), 1)}</span>, <span className="mono">{delta(accOf(cur), accOf(prev), 1)}</span>],
    ['Opponents', 0, 0, <b className="mono">{fmt(oppOf(cur), 0)}</b>, <span className="mono">{fmt(oppOf(prev), 0)}</span>, <span className="mono">{delta(oppOf(cur), oppOf(prev), 0)}</span>],
  ];

  return (
    <Card
      title="This week"
      right={<span className="st-note">Last 7 days against the 7 before</span>}
      info="Compares the last 7 days with the 7 days before that. Change shows how each number moved: green is better, red is worse. Accuracy only counts analysed games."
    >
      <div className="st-wk">
        <div className="st-wk-row head"><span /><span className="r">This week</span><span className="r">Last week</span><span className="r">Change</span></div>
        {rows.map(([label, , , a, b, c]) => (
          <div key={label} className="st-wk-row">
            <span className="muted">{label}</span>
            <span className="r">{a}</span>
            <span className="r">{b}</span>
            <span className="r">{c}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PhaseCard({ games }) {
  const [sel, setSel] = useState(null);

  const data = useMemo(() => {
    const phases = { Opening: {}, Middlegame: {}, Endgame: {} };
    Object.values(phases).forEach(p => { p.tactical = 0; p.positional = 0; p.strategic = 0; });
    for (const g of games) {
      (readMistakes(g) || []).forEach(m => {
        const n = m.moveNumber || 0;
        const ph = n <= 10 ? 'Opening' : n <= 30 ? 'Middlegame' : 'Endgame';
        if (phases[ph][m.type] != null) phases[ph][m.type]++;
      });
    }
    return phases;
  }, [games]);

  const types = ['tactical', 'positional', 'strategic'];
  const active = sel ? [sel] : types;
  const totalOf = p => active.reduce((s, t) => s + data[p][t], 0);
  const grand = types.reduce((s, t) => s + Object.values(data).reduce((a, p) => a + p[t], 0), 0);
  const max = Math.max(1, ...Object.keys(data).map(totalOf));
  const top = Object.keys(data).sort((a, b) => totalOf(b) - totalOf(a))[0];
  const topShare = grand ? Math.round((Object.keys(data).reduce((s, p) => s + (p === top ? types.reduce((a, t) => a + data[p][t], 0) : 0), 0) / grand) * 100) : 0;

  return (
    <Card
      title="Mistakes by phase"
      sub={grand ? `${topShare}% of your mistakes come in the ${top.toLowerCase()}.` : 'Analyse games to see where your mistakes happen.'}
      info="Opening is up to move 10, middlegame is moves 11 to 30 and endgame is after move 30. Tactical mistakes lose more than 2 pawns, positional 1 to 2 pawns, strategic 0.4 to 1 pawn. Choose a severity to filter the bars."
    >
      <div className="st-ph-legend">
        {types.map(t => (
          <button key={t} className={`${sel === t ? 'on' : ''}${sel && sel !== t ? ' dim' : ''}`} onClick={() => setSel(sel === t ? null : t)}>
            <i style={{ background: TYPE_COLOR[t] }} />{t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {Object.keys(data).map(p => (
        <div key={p} className="st-ph-row">
          <span>{p}</span>
          <div className="st-ph-track" style={{ width: `${(totalOf(p) / max) * 100}%` }}>
            {active.map(t => data[p][t] > 0 && <i key={t} style={{ flex: data[p][t], background: TYPE_COLOR[t] }} title={`${t}: ${data[p][t]}`} />)}
          </div>
          <b className="mono">{totalOf(p)}</b>
        </div>
      ))}
      <p className="st-note" style={{ marginTop: 14 }}>Choose a severity to filter, or tap a bar for its count.</p>
    </Card>
  );
}

export default function Stats() {
  const navigate = useNavigate();
  const { games } = useStore();
  const [platform, setPlatform] = useState('All');
  const [tc, setTc] = useState('All');
  const openGame = id => navigate(`/analysis?id=${encodeURIComponent(id)}`);

  const classes = useMemo(() => ['Blitz', 'Rapid', 'Daily', 'Bullet'].filter(c => games.some(g => timeClass(g) === c)), [games]);
  const platforms = useMemo(() => [...new Set(games.map(g => g.platform))], [games]);
  const filtered = games.filter(g => (platform === 'All' || g.platform === platform) && (tc === 'All' || timeClass(g) === tc));
  const chrono = [...filtered].sort((a, b) => new Date(a.date_played) - new Date(b.date_played));

  const accPoints = chrono
    .map(g => ({ g, acc: gameAccuracy(g) }))
    .filter(p => p.acc?.me != null)
    .map(({ g, acc }) => ({ id: g.platform_game_id, me: acc.me, opp: acc.opp, result: g.result, date: g.date_played, opponent: g.opponent }))
    .slice(-50);

  const now = Date.now();
  const weekAcc = (from, to) => avg(filtered
    .filter(g => { const a = now - new Date(g.date_played); return a > from && a <= to; })
    .map(gameAccuracy).filter(a => a?.me != null).map(a => a.me));

  return (
    <div className="animate-slide-up st-page">
      <div className="st-head">
        <div>
          <div className="st-eyebrow">Your games in numbers</div>
          <h1 className="st-title">Stats</h1>
        </div>
        <div className="st-filters">
          {platforms.length > 1 && <Segmented small options={['All', ...platforms]} value={platform} onChange={setPlatform} />}
          {classes.length > 0 && <Segmented small options={['All', ...classes]} value={tc} onChange={setTc} />}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><h3>No games match</h3><p className="text-secondary">Connect a profile or clear the filters.</p></div>
      ) : (
        <div className="st-stack">
          <KpiStrip
            games={filtered}
            accPoints={accPoints}
            thisWeekAcc={weekAcc(-Infinity, 7 * DAY)}
            lastWeekAcc={weekAcc(7 * DAY, 14 * DAY)}
            onOpen={openGame}
          />

          <div className="st-two">
            <RatingChart games={filtered} />
            {accPoints.length ? (
              <AccuracyChart points={accPoints} onOpen={openGame} average={avg(accPoints.map(p => p.me))} oppAverage={avg(accPoints.map(p => p.opp).filter(v => v != null))} />
            ) : (
              <Card title="Accuracy trend"><p className="st-empty">No accuracy yet. Analyse games here, or use Sync New Games to pull accuracy from games you reviewed on Chess.com or Lichess.</p></Card>
            )}
          </div>

          <Breakdown games={filtered} />

          <div className="st-two top">
            <div className="st-stack">
              <Openings games={filtered} onOpen={openGame} />
              <ThisWeek games={filtered} />
            </div>
            <div className="st-stack">
              <Heatmap games={filtered} />
              <PhaseCard games={filtered} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
