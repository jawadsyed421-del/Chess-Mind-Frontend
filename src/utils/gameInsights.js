// Derived views over imported games: tidy labels, performance overview, play style and recommendations.

export const platformName = p => (p === 'lichess' ? 'Lichess' : 'Chess.com');

// Older Chess.com imports stored the ECO URL path ("/Www.Chess.Com/Openings/Vienna Game ...").
export function cleanOpening(name) {
  if (!name) return 'Unknown Opening';
  const m = name.match(/openings\/(.+)$/i);
  return (m ? m[1] : name).replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Shorter family name for grouping ("Four Knights Game Italian Variation" -> "Four Knights Game").
function openingFamily(name) {
  const clean = cleanOpening(name).split(':')[0];
  const m = clean.match(/^(.*?\b(Game|Opening|Defense|Defence|Gambit|Attack|System))\b/i);
  return (m ? m[1] : clean.split(/\s\d/)[0]).trim();
}

// Chess.com sends seconds ("300", "180+2", "1/86400"); Lichess sends minutes ("5+3").
export function formatTimeControl(tc, platform) {
  if (!tc || tc === 'unknown') return null;
  if (tc.includes('/')) return 'Daily';
  const m = String(tc).match(/^(\d+(?:\.\d+)?)(?:\+(\d+))?$/);
  if (!m) return tc;
  const mins = platform === 'lichess' ? Number(m[1]) : Number(m[1]) / 60;
  const base = mins < 1 ? `${Math.round(mins * 60)} sec` : `${+mins.toFixed(1)} min`;
  return m[2] && m[2] !== '0' ? `${base} + ${m[2]}s` : base;
}

const myRating =g => (g.player_color === 'white' ? g.white_rating : g.black_rating);

function moveCount(pgn) {
  if (!pgn) return 0;
  const nums = pgn.replace(/\[[^\]]*\]/g, '').match(/\b(\d+)\.(?!\.)/g);
  return nums ? parseInt(nums[nums.length - 1], 10) : 0;
}

function firstMove(pgn) {
  const m = (pgn || '').replace(/\[[^\]]*\]/g, '').match(/1\.\s*([^\s]+)/);
  return m ? m[1] : null;
}

const lostOnTime = g => g.result === 'loss' && /on time|timeout|time forfeit/i.test(g.pgn || '');

function record(list) {
  const w = list.filter(g => g.result === 'win').length;
  const l = list.filter(g => g.result === 'loss').length;
  const d = list.filter(g => g.result === 'draw').length;
  return { w, l, d, n: list.length, winRate: list.length ? Math.round((w / list.length) * 100) : 0 };
}

export function performanceOverview(games, limit = 20) {
  const recent = [...games].sort((a, b) => new Date(b.date_played) - new Date(a.date_played)).slice(0, limit);
  const ratings = [...recent].reverse().map(myRating).filter(Boolean);
  return {
    recent,
    all: record(recent),
    white: record(recent.filter(g => g.player_color === 'white')),
    black: record(recent.filter(g => g.player_color === 'black')),
    ratings,
    ratingChange: ratings.length > 1 ? ratings[ratings.length - 1] - ratings[0] : 0,
    form: recent.slice(0, 10).map(g => g.result),
  };
}

export function playStyle(games) {
  const lengths = games.map(g => moveCount(g.pgn)).filter(Boolean);
  const avgMoves = lengths.length ? Math.round(lengths.reduce((s, n) => s + n, 0) / lengths.length) : null;
  const decisive = games.length ? games.filter(g => g.result !== 'draw').length / games.length : 0;
  const quickWins = games.filter(g => g.result === 'win' && moveCount(g.pgn) && moveCount(g.pgn) <= 30).length;

  let label = 'Balanced';
  let desc = 'You mix sharp and quiet positions and your games rarely follow one pattern.';
  if (avgMoves && avgMoves <= 32 && decisive > 0.85) {
    label = 'Aggressive';
    desc = 'Your games are short and decisive. You look for early attacks and rarely settle for a draw.';
  } else if (avgMoves && avgMoves >= 45) {
    label = 'Patient grinder';
    desc = 'Your games run long. You keep pieces on and play on into endgames.';
  } else if (decisive < 0.7) {
    label = 'Solid';
    desc = 'You draw often and avoid big risks. Look for chances to play for a win.';
  }

  const tally = (list, key) => Object.entries(list.reduce((a, g) => {
    const k = key(g);
    if (k) a[k] = (a[k] || 0) + 1;
    return a;
  }, {})).sort((a, b) => b[1] - a[1]);

  const asWhite = games.filter(g => g.player_color === 'white');
  const asBlack = games.filter(g => g.player_color === 'black');

  return {
    label,
    desc,
    avgMoves,
    quickWins,
    favouriteFirstMove: tally(asWhite, g => firstMove(g.pgn))[0]?.[0] || null,
    whiteOpening: tally(asWhite, g => openingFamily(g.opening_name))[0]?.[0] || null,
    blackOpening: tally(asBlack, g => openingFamily(g.opening_name))[0]?.[0] || null,
    timeControl: tally(games, g => formatTimeControl(g.time_control, g.platform))[0]?.[0] || null,
  };
}

export function recommendations(games, weaknesses) {
  const recs = [];
  const all = ['tactical', 'positional', 'strategic'].flatMap(t => (weaknesses?.[t] || []).map(i => ({ ...i, type: t })));
  const weakest = all
    .filter(i => i.status === 'Needs Practice')
    .sort((a, b) => (b.errorsCount * 2 - b.practiceCount) - (a.errorsCount * 2 - a.practiceCount))[0];
  if (weakest) {
    recs.push({
      title: `Practise ${weakest.name}`,
      body: `${weakest.errorsCount} mistakes found in this area. Short drills here give the quickest gains.`,
      to: '/training',
      cta: 'Start drills',
    });
  }

  const pending = games.filter(g => g.analysis_status !== 'complete').length;
  if (pending) {
    recs.push({
      title: `Analyse ${pending} more game${pending > 1 ? 's' : ''}`,
      body: 'Each analysed game sharpens your weakness profile and adds new practice positions.',
      to: '/games',
      cta: 'Open games',
    });
  }

  const byOpening = games.reduce((a, g) => {
    const k = openingFamily(g.opening_name);
    (a[k] = a[k] || []).push(g);
    return a;
  }, {});
  const worst = Object.entries(byOpening)
    .map(([name, list]) => ({ name, ...record(list) }))
    .filter(o => o.n >= 2 && o.name !== 'Unknown Opening')
    .sort((a, b) => a.winRate - b.winRate)[0];
  if (worst && worst.winRate < 45) {
    recs.push({
      title: `Rework your ${worst.name}`,
      body: `You score ${worst.winRate}% in ${worst.n} games with it. Review the losses to find where it goes wrong.`,
      to: '/games',
      cta: 'Review games',
    });
  }

  const white = record(games.filter(g => g.player_color === 'white'));
  const black = record(games.filter(g => g.player_color === 'black'));
  if (white.n >= 3 && black.n >= 3 && Math.abs(white.winRate - black.winRate) >= 20) {
    const weak = white.winRate < black.winRate ? 'White' : 'Black';
    recs.push({
      title: `Strengthen your play as ${weak}`,
      body: `You win ${white.winRate}% as White and ${black.winRate}% as Black.`,
      to: '/stats',
      cta: 'See stats',
    });
  }

  const timeLosses = games.filter(lostOnTime).length;
  if (timeLosses >= 2) {
    recs.push({
      title: 'Watch your clock',
      body: `${timeLosses} of your recent losses came on time. Make faster decisions in simple positions.`,
      to: '/stats',
      cta: 'See stats',
    });
  }

  return recs.slice(0, 4);
}

// Consecutive days (ending today or yesterday) with at least one practice attempt.
export function practiceStreak(history) {
  const days = new Set(history.map(h => new Date(h.date).toDateString()));
  const count = start => {
    let n = 0;
    const d = new Date(start);
    while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); }
    return n;
  };
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const current = count(today) || count(yesterday);

  let best = 0;
  for (const day of days) best = Math.max(best, count(new Date(day)));
  return { current, best };
}

// Lichess-style accuracy from Stockfish evals (pawns, White's view): win% loss per move -> 0-100 score.
export const winPct = pawns => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * pawns * 100)) - 1);

export function accuracyFromEvals(moveEvaluations) {
  const sums = { w: [], b: [] };
  for (const m of moveEvaluations || []) {
    if (typeof m.evalBefore !== 'number' || typeof m.evalAfter !== 'number') continue;
    const sign = m.color === 'w' ? 1 : -1;
    const loss = Math.max(0, winPct(sign * m.evalBefore) - winPct(sign * m.evalAfter));
    const acc = Math.min(100, Math.max(0, 103.1668 * Math.exp(-0.04354 * loss) - 3.1669));
    sums[m.color]?.push(acc);
  }
  const avg = list => (list.length ? Math.round((list.reduce((s, n) => s + n, 0) / list.length) * 10) / 10 : null);
  return { white: avg(sums.w), black: avg(sums.b) };
}

// Platform accuracy when available (Chess.com Game Review / Lichess analysis), else our own engine run.
export function gameAccuracy(g) {
  const white = g.white_accuracy ?? g.engine_accuracy?.white ?? null;
  const black = g.black_accuracy ?? g.engine_accuracy?.black ?? null;
  if (white == null && black == null) return null;
  return g.player_color === 'white' ? { me: white, opp: black } : { me: black, opp: white };
}

// Destination square of a SAN move from the mover's side ("Nxe5+" -> e5, "O-O" -> g1/g8).
export function sanTarget(san, color) {
  if (!san) return null;
  const rank = color === 'b' || color === 'black' ? '8' : '1';
  if (san.startsWith('O-O-O')) return `c${rank}`;
  if (san.startsWith('O-O')) return `g${rank}`;
  const sq = san.match(/[a-h][1-8]/g);
  return sq ? sq[sq.length - 1] : null;
}

// Rates one move by how much winning chance the mover gave away (same scale Chess.com and Lichess use).
export function classifyMove(ev, san) {
  if (!ev || typeof ev.evalBefore !== 'number' || typeof ev.evalAfter !== 'number') return null;
  const sign = ev.color === 'b' ? -1 : 1;
  const loss = Math.max(0, winPct(sign * ev.evalBefore) - winPct(sign * ev.evalAfter));
  const isBest = ev.bestMoveSan && san && ev.bestMoveSan === san;
  if (isBest) return { key: 'best', label: 'Best move', tone: 'good', loss };
  if (loss < 2) return { key: 'excellent', label: 'Excellent move', tone: 'good', loss };
  if (loss < 5) return { key: 'good', label: 'Good move', tone: 'good', loss };
  if (loss < 10) return { key: 'inaccuracy', label: 'Inaccuracy', tone: 'warn', loss };
  if (loss < 20) return { key: 'mistake', label: 'Mistake', tone: 'bad', loss };
  return { key: 'blunder', label: 'Blunder', tone: 'bad', loss };
}
