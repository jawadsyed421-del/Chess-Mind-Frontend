import { Chess } from 'chess.js';

// Plain-English explanations of chess moves, built from the position itself (no engine needed).
// It answers: what does this move do, what does it risk, and why was another move better?

const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const ORDER = { p: 1, n: 3, b: 3.1, r: 5, q: 9, k: 100 };
const NAME = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const CENTRE = ['d4', 'e4', 'd5', 'e5'];
const other = c => (c === 'w' ? 'b' : 'w');
const pieceName = t => NAME[t] || 'piece';
const a = name => `a ${name}`;

function safeChess(fen) {
  try { return new Chess(fen); } catch { return null; }
}

// The same position with the other side to move (null when that is not a legal position).
function flipTurn(fen) {
  const p = fen.split(' ');
  p[1] = other(p[1]);
  p[3] = '-';
  return safeChess(p.join(' '));
}

function pieces(chess, color) {
  const out = [];
  chess.board().forEach(row => row.forEach(sq => { if (sq && (!color || sq.color === color)) out.push(sq); }));
  return out;
}

// What the side to move wins by capturing on `sq`, counting recaptures (never below 0).
function exchange(chess, sq, depth = 0) {
  if (depth > 6) return 0;
  const caps = chess.moves({ verbose: true }).filter(m => m.to === sq && m.captured);
  if (!caps.length) return 0;
  caps.sort((x, y) => ORDER[x.piece] - ORDER[y.piece]);
  const m = caps[0];
  chess.move(m);
  const back = exchange(chess, sq, depth + 1);
  chess.undo();
  return Math.max(0, VAL[m.captured] - back);
}

// Enemy pieces (not pawns unless loose) that the piece on `from` attacks right now.
function targetsOf(chess, from, color) {
  const mover = chess.get(from);
  if (!mover) return [];
  const flipped = chess.turn() === color ? chess : flipTurn(chess.fen());
  if (!flipped) return [];
  return flipped.moves({ verbose: true })
    .filter(m => m.from === from && m.captured && m.captured !== 'k')
    .map(m => {
      const t = { square: m.to, type: m.captured };
      const defended = chess.attackers(m.to, other(color)).length > 0;
      return { ...t, defended, worthIt: !defended || VAL[t.type] > VAL[mover.type] };
    });
}

function countMobility(fen, sq) {
  const c = safeChess(fen);
  if (!c) return 0;
  try { return c.moves({ square: sq }).length; } catch { return 0; }
}

function isOpenFile(chess, file, color) {
  let own = false;
  let enemy = false;
  chess.board().forEach(row => row.forEach(s => {
    if (s && s.type === 'p' && s.square[0] === file) { if (s.color === color) own = true; else enemy = true; }
  }));
  return { open: !own && !enemy, semi: !own && enemy };
}

function isPassed(chess, sq, color) {
  const file = sq.charCodeAt(0);
  const rank = Number(sq[1]);
  return !pieces(chess, other(color)).some(p => p.type === 'p'
    && Math.abs(p.square.charCodeAt(0) - file) <= 1
    && (color === 'w' ? Number(p.square[1]) > rank : Number(p.square[1]) < rank));
}

function isOutpost(chess, sq, color) {
  const file = sq.charCodeAt(0);
  const rank = Number(sq[1]);
  if (color === 'w' ? rank < 4 || rank > 6 : rank > 5 || rank < 3) return false;
  const supported = pieces(chess, color).some(p => p.type === 'p'
    && Math.abs(p.square.charCodeAt(0) - file) === 1
    && Number(p.square[1]) === (color === 'w' ? rank - 1 : rank + 1));
  const harassed = pieces(chess, other(color)).some(p => p.type === 'p'
    && Math.abs(p.square.charCodeAt(0) - file) === 1
    && (color === 'w' ? Number(p.square[1]) > rank : Number(p.square[1]) < rank));
  return supported && !harassed;
}

const HOME = { w: { n: ['b1', 'g1'], b: ['c1', 'f1'], r: ['a1', 'h1'], q: ['d1'] }, b: { n: ['b8', 'g8'], b: ['c8', 'f8'], r: ['a8', 'h8'], q: ['d8'] } };

function opponentMateIn1(chess) {
  for (const m of chess.moves({ verbose: true })) {
    chess.move(m);
    const mate = chess.isCheckmate();
    chess.undo();
    if (mate) return m.san;
  }
  return null;
}

// Everything notable about playing `san` in `fen`. Points are ordered most important first.
export function describeMove(fen, san, { you = true } = {}) {
  const chess = safeChess(fen);
  if (!chess) return null;
  let move;
  try { move = chess.move(san); } catch { return null; }
  if (!move) return null;

  const color = move.color;
  const who = you ? 'You' : 'They';
  const whose = you ? 'your' : 'their';
  const pName = pieceName(move.piece);
  const fenAfter = chess.fen();
  const before = safeChess(fen);
  const fullMove = Number(fen.split(' ')[5]) || 1;
  const material = pieces(before).reduce((s, p) => s + (p.type === 'q' ? 9 : p.type === 'r' ? 5 : p.type === 'p' || p.type === 'k' ? 0 : 3), 0);
  const phase = fullMove <= 10 ? 'opening' : material <= 24 ? 'endgame' : 'middlegame';

  const good = []; // reasons the move works
  const risks = []; // problems with the move
  const info = { move, phase, san: move.san };

  // --- material ---
  const oppGainOnTo = exchange(chess, move.to); // what the opponent wins by taking the moved piece
  const capturedVal = move.captured ? VAL[move.captured] : 0;
  const net = capturedVal - oppGainOnTo;
  info.net = net;
  info.hangs = oppGainOnTo > 0 && !(move.captured && net > 0);

  if (chess.isCheckmate()) {
    good.push({ w: 100, t: `${who} deliver checkmate. The king has no escape, no block and no capture, so the game is over.` });
  } else {
    if (move.captured) {
      const cn = pieceName(move.captured);
      if (move.captured === 'p' && move.flags.includes('e')) {
        good.push({ w: 3, t: `${who} capture a pawn en passant.` });
      } else if (oppGainOnTo === 0 && capturedVal > 0) {
        good.push({ w: 8 + capturedVal, t: `${who} win ${a(cn)} for free: the ${cn} on ${move.to} cannot be taken back, so ${you ? 'you gain' : 'they gain'} ${capturedVal === 1 ? 'a pawn' : `${capturedVal} points of material`}.` });
      } else if (net > 0) {
        good.push({ w: 6 + net, t: `${who} capture the ${cn} on ${move.to}. It can be recaptured, but ${you ? 'you' : 'they'} still come out ahead in the exchange.` });
      } else if (VAL[move.captured] === VAL[move.piece] || net === 0) {
        good.push({ w: 4, t: `${who} trade ${a(pName)} for ${a(cn)}. An even trade like this simplifies the position${phase === 'endgame' ? ' and brings the endgame closer' : ''}.` });
      } else {
        risks.push({ w: 8, t: `${who} capture the ${cn} on ${move.to}, but the ${pName} can be taken back, so the trade loses about ${Math.abs(net)} point${Math.abs(net) === 1 ? '' : 's'}.` });
      }
    }
    if (move.promotion) good.push({ w: 9, t: `${who} promote the pawn to ${a(pieceName(move.promotion))}, a huge gain in material.` });
    if (chess.isCheck()) {
      const targets = targetsOf(chess, move.to, color);
      const big = targets.filter(t => t.type === 'q' || t.type === 'r');
      good.push({ w: 5, t: big.length
        ? `${who} give check and at the same time attack the ${pieceName(big[0].type)} on ${big[0].square}, so the opponent must deal with the check and may lose that piece.`
        : `${who} give check, which forces the opponent to respond to the king before anything else.` });
    }
  }

  // --- threat of checkmate ---
  if (!chess.isCheckmate() && !chess.isCheck()) {
    const passed = flipTurn(fenAfter);
    const mateThreat = passed ? opponentMateIn1(passed) : null;
    if (mateThreat) good.push({ w: 9, t: `${who} threaten checkmate with ${mateThreat}, so the opponent has to defend immediately.` });
  }

  // --- threats created by the moved piece ---
  const targets = targetsOf(chess, move.to, color).filter(t => t.worthIt && (t.type !== 'p' || !t.defended));
  if (!chess.isCheckmate()) {
    if (targets.length >= 2) {
      const [t1, t2] = targets.sort((x, y) => VAL[y.type] - VAL[x.type]);
      good.push({ w: 7, t: `${who} fork two pieces: the ${pName} on ${move.to} attacks the ${pieceName(t1.type)} on ${t1.square} and the ${pieceName(t2.type)} on ${t2.square}. The opponent can only save one of them.` });
    } else if (targets.length === 1 && !move.captured) {
      const t = targets[0];
      good.push({ w: 4, t: `The ${pName} now attacks the ${pieceName(t.type)} on ${t.square}${t.defended ? `, which is worth more than your ${pName}` : ', which has no protection'}, so a reply is needed.` });
    }
  }

  // --- discovered attack: a different piece suddenly attacks something ---
  const hadAttack = new Set(); // (attacker>target) pairs the mover already had before the move
  before.moves({ verbose: true }).filter(m => m.captured && VAL[m.captured] >= 3).forEach(m => hadAttack.add(`${m.from}>${m.to}`));
  const nowAttacks = flipTurn(fenAfter); // the mover's attacks in the new position
  if (nowAttacks && !chess.isCheckmate() && !move.captured) {
    const fresh = nowAttacks.moves({ verbose: true })
      .filter(m => m.captured && VAL[m.captured] >= 3 && m.from !== move.to && !hadAttack.has(`${m.from}>${m.to}`));
    if (fresh.length) {
      const f = fresh[0];
      good.push({ w: 5, t: `Moving the ${pName} opens a line for the ${pieceName(f.piece)} on ${f.from}, which now attacks the ${pieceName(f.captured)} on ${f.to} (a discovered attack).` });
    }
  }

  // --- risks ---
  if (info.hangs && !chess.isCheckmate()) {
    const taker = chess.moves({ verbose: true }).filter(m => m.to === move.to && m.captured).sort((x, y) => ORDER[x.piece] - ORDER[y.piece])[0];
    risks.push({ w: 9, t: `The ${pName} lands on ${move.to}, where it can be captured${taker ? ` by the ${pieceName(taker.piece)} on ${taker.from}` : ''}, and ${whose} side cannot win it back, so ${you ? 'you lose' : 'they lose'} about ${oppGainOnTo} point${oppGainOnTo === 1 ? '' : 's'}.` });
  }
  if (!chess.isCheckmate()) {
    const mate = opponentMateIn1(chess);
    if (mate) risks.push({ w: 12, t: `It allows checkmate in one: ${mate}.` });

    // another piece left hanging by this move, or an existing threat that was ignored
    const before2 = flipTurn(fen);
    let worst = null;
    let ignored = null;
    pieces(chess, color).forEach(p => {
      if (p.square === move.to || p.type === 'k') return;
      const loss = exchange(chess, p.square);
      if (loss <= 0) return;
      let already = 0;
      if (before2) { try { already = exchange(before2, p.square); } catch { already = 0; } }
      if (already > 0 && p.square !== move.from) { if (!ignored || loss > ignored.loss) ignored = { ...p, loss }; }
      else if (loss > already && (!worst || loss > worst.loss)) worst = { ...p, loss };
    });
    if (ignored && !mate) {
      risks.push({ w: 8, t: `${you ? 'You' : 'They'} ignore the threat against ${whose} ${pieceName(ignored.type)} on ${ignored.square}. It was already attacked, and this move does nothing to save it.` });
    } else if (worst && !mate) {
      risks.push({ w: 7, t: `It leaves ${whose} ${pieceName(worst.type)} on ${worst.square} without enough protection, so it can be captured for free.` });
    }
  }

  // --- rescuing / defending ---
  if (!move.captured && !chess.isCheckmate()) {
    const b2 = flipTurn(fen);
    if (b2) {
      const threatened = b2.moves({ verbose: true }).filter(m => m.captured && VAL[m.captured] >= 3 && m.to === move.from);
      if (threatened.length && exchange(chess, move.to) === 0) {
        good.push({ w: 6, t: `${who} move the ${pName} out of danger. On ${move.from} it was under attack by the ${pieceName(threatened[0].piece)} on ${threatened[0].from}.` });
      } else {
        // an attacked own piece that is now safe
        let saved = null;
        pieces(before, color).forEach(p => {
          if (p.square === move.from || p.type === 'k' || p.type === 'p') return;
          const was = exchange(b2, p.square);
          const now = exchange(chess, p.square);
          if (was > 0 && now === 0 && !saved) saved = p;
        });
        if (saved) good.push({ w: 6, t: `${who} protect the ${pieceName(saved.type)} on ${saved.square}, which was in danger of being captured.` });
      }
    }
  }

  // --- king safety & structure & activity ---
  if (move.flags.includes('k') || move.flags.includes('q')) {
    good.push({ w: 5, t: `${who} castle ${move.flags.includes('k') ? 'kingside' : 'queenside'}. The king moves behind its pawns and the rook joins the game.` });
  }
  if (move.piece === 'p' && !move.captured) {
    if (CENTRE.includes(move.to)) good.push({ w: 3, t: `The pawn takes a central square (${move.to}). Central pawns give your pieces room and control key squares.` });
    if (isPassed(chess, move.to, color) && phase !== 'opening') good.push({ w: 4, t: `The pawn on ${move.to} is a passed pawn: no enemy pawn can stop it on its way to promotion.` });
  }
  if (['n', 'b'].includes(move.piece) && HOME[color][move.piece].includes(move.from) && phase === 'opening') {
    const eyes = CENTRE.filter(sq => chess.attackers(sq, color).some(s => s === move.to));
    good.push({ w: 3, t: `${who} develop the ${pName} from its starting square${eyes.length ? `, where it now watches the centre (${eyes.join(', ')})` : ''}. Getting pieces out early is a basic opening rule.` });
  }
  if (move.piece === 'r') {
    const f = isOpenFile(chess, move.to[0], color);
    if (f.open) good.push({ w: 3, t: `The rook goes to the open ${move.to[0]}-file, where no pawns block it.` });
    else if (f.semi) good.push({ w: 2, t: `The rook goes to the half-open ${move.to[0]}-file, pointing at an enemy pawn.` });
    if (move.to[1] === (color === 'w' ? '7' : '2')) good.push({ w: 3, t: 'A rook on the seventh rank attacks pawns from behind and pins the enemy king in.' });
  }
  if (move.piece === 'n' && isOutpost(chess, move.to, color)) {
    good.push({ w: 3, t: `The knight on ${move.to} is on an outpost: protected by a pawn and safe from enemy pawns, so it can stay there for a long time.` });
  }
  if (move.piece === 'k' && phase === 'endgame') {
    good.push({ w: 2, t: 'In the endgame the king is a strong piece. Bringing it toward the centre helps it support pawns and attack.' });
  }

  // --- activity fallback ---
  const mobBefore = countMobility(fen, move.from);
  const mobAfter = countMobility(flipTurn(fenAfter)?.fen() || fenAfter, move.to);
  if (['n', 'b', 'r', 'q'].includes(move.piece) && mobAfter - mobBefore >= 3 && !good.length) {
    good.push({ w: 2, t: `The ${pName} becomes more active: from ${move.to} it can reach ${mobAfter} squares instead of ${mobBefore}.` });
  }

  if (chess.isCheckmate()) good.splice(1); // checkmate says it all
  good.sort((x, y) => y.w - x.w);
  risks.sort((x, y) => y.w - x.w);
  info.good = good.map(g => g.t);
  info.risks = risks.map(r => r.t);
  info.fenAfter = fenAfter;
  return info;
}

// "+1.4" style evaluation in pawns (White's view); |score| >= 90 is a forced mate.
export function evalWords(score, color) {
  if (typeof score !== 'number') return null;
  const mine = color === 'b' ? -score : score;
  if (Math.abs(score) >= 90) return mine > 0 ? 'a forced checkmate for you' : 'a forced checkmate against you';
  if (mine > 3) return 'winning for you';
  if (mine > 1.2) return 'clearly better for you';
  if (mine > 0.35) return 'slightly better for you';
  if (mine > -0.35) return 'roughly equal';
  if (mine > -1.2) return 'slightly worse for you';
  if (mine > -3) return 'clearly worse for you';
  return 'losing for you';
}

const fmtScore = s => (Math.abs(s) >= 90 ? (s > 0 ? '#' : '-#') : `${s > 0 ? '+' : ''}${s.toFixed(2)}`);

// Move list "12. Nf3 Nc6 13. d4" starting from the side to move in `fen`.
export function formatLine(fen, sans) {
  const p = fen.split(' ');
  let n = Number(p[5]) || 1;
  let white = p[1] === 'w';
  const out = [];
  sans.forEach((s, i) => {
    if (white) out.push(`${n}.`);
    else if (i === 0) out.push(`${n}...`);
    out.push(s);
    if (!white) n += 1;
    white = !white;
  });
  return out.join(' ');
}

// Full explanation of one move in a game.
//   ev: { evalBefore, evalAfter, bestMoveSan, color } for this move
//   replyBest: the engine's best reply after the move (from the next move's evaluation)
//   pv: optional engine line (SAN) starting with the best move
export function explainGameMove({ fenBefore, san, ev, rating, replyBest, pv, you = true }) {
  const played = describeMove(fenBefore, san, { you });
  if (!played) return null;
  const color = played.move.color;
  const bestSan = ev?.bestMoveSan;
  const isBest = !bestSan || bestSan === san;
  const best = !isBest ? describeMove(fenBefore, bestSan, { you }) : null;
  const subject = you ? 'your' : 'their';

  const out = {
    san,
    played: { good: played.good, risks: played.risks },
    best: null,
    reply: null,
    verdict: '',
    evalNote: null,
    line: null,
  };

  // overall verdict sentence
  if (rating) {
    if (rating.key === 'best') out.verdict = `${san} is the best move here. The engine would play exactly this.`;
    else if (rating.tone === 'good') out.verdict = `${san} is a good move. It keeps ${subject} position healthy${bestSan ? `, though ${bestSan} was slightly more precise` : ''}.`;
    else if (rating.key === 'inaccuracy') out.verdict = `${san} is an inaccuracy. It is not a disaster, but it gives away some of ${subject} advantage.`;
    else if (rating.key === 'mistake') out.verdict = `${san} is a mistake. It hands the opponent a real chance.`;
    else out.verdict = `${san} is a blunder. It swings the game sharply in the opponent's favour.`;
  }

  if (ev && typeof ev.evalBefore === 'number' && typeof ev.evalAfter === 'number') {
    const w = evalWords(ev.evalAfter, color);
    out.evalNote = `Evaluation went from ${fmtScore(ev.evalBefore)} to ${fmtScore(ev.evalAfter)} (White's view): the position is now ${w}.`;
  }

  if (best) {
    const points = best.good.length ? best.good : [`It keeps the position under control and improves ${subject} pieces without creating weaknesses.`];
    out.best = { san: bestSan, points: points.slice(0, 4), whyNot: played.risks.length ? played.risks.slice(0, 2) : [] };
    const bestIdea = [];
    if (typeof ev?.evalBefore === 'number') {
      bestIdea.push(`After ${bestSan} the engine keeps the evaluation near ${fmtScore(ev.evalBefore)}; after ${san} it drops to ${fmtScore(ev.evalAfter)}.`);
    }
    out.best.compare = bestIdea;
  }

  if (replyBest && played.fenAfter) {
    const r = describeMove(played.fenAfter, replyBest, { you: !you });
    if (r) {
      const first = r.good[0] || '';
      out.reply = { san: replyBest, text: first || `${replyBest} is the engine's best answer.` };
    }
  }

  if (pv && pv.length > 1) out.line = formatLine(fenBefore, pv.slice(0, 5));
  return out;
}

// Short reason a puzzle's first move works (shown after solving). `gap` is how many pawns worse the
// next-best move is, according to the engine.
export function explainPuzzleMove(fen, san, gap) {
  const d = describeMove(fen, san, { you: true });
  const points = d ? d.good.slice(0, 3) : [];
  const margin = gap ? `The engine rates every other move at least ${gap.toFixed(1)} pawns worse, so this is the only move that keeps the advantage.` : '';
  if (!points.length && d?.risks.length) points.push('At first sight this gives up material, so it is easy to dismiss. The engine shows that the attack or position you get in return is worth more.');
  if (!points.length) points.push(`A precise, quiet move. It does not win anything at once, but every other move gives the opponent a clear improvement.`);
  if (margin) points.push(margin);
  return points;
}

// Which tactical theme a move shows, used to label puzzles.
export function themeOf(fen, san) {
  const d = describeMove(fen, san, { you: true });
  if (!d) return 'Tactics';
  const text = d.good.join(' ');
  if (/deliver checkmate/.test(text)) return 'Checkmate';
  if (/threaten checkmate/.test(text)) return 'Mating attack';
  if (/fork/.test(text)) return 'Fork';
  if (/discovered/.test(text)) return 'Discovered attack';
  if (/promote/.test(text)) return 'Promotion';
  if (/give check/.test(text)) return 'Attack on the king';
  if (/for free/.test(text)) return 'Winning material';
  if (/out of danger|protect the/.test(text)) return 'Defence';
  if (/exchange/.test(text)) return 'Exchanges';
  return 'Tactics';
}
