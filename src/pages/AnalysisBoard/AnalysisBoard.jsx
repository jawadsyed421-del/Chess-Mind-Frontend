import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import InteractiveBoard from '../../components/Chessboard/InteractiveBoard';
import { useStore } from '../../store/useStore';
import api from '../../services/api';
import { classifyMove } from '../../utils/gameInsights';
import InfoToggle from '../../components/InfoToggle/InfoToggle';
import { Copy, RotateCcw, Cpu, Undo2, Lightbulb } from 'lucide-react';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const TONE_COLOR = { good: 'var(--accent-success)', warn: 'var(--accent-warning)', bad: 'var(--accent-danger)' };
const TONE_SQUARE = { good: 'rgba(143, 211, 160, 0.55)', warn: 'rgba(224, 169, 59, 0.5)', bad: 'rgba(228, 96, 77, 0.6)' };
const SIDES = [
  { key: 'white', label: 'Play White' },
  { key: 'black', label: 'Play Black' },
  { key: 'both', label: 'Both sides' },
];

const fmtScore = ev => (ev ? (ev.mate ? `M${Math.abs(ev.mate)}` : `${ev.score > 0 ? '+' : ''}${ev.score.toFixed(2)}`) : '…');

export default function AnalysisBoard() {
  const [params] = useSearchParams();
  const addToast = useStore(s => s.addToast);
  const initial = params.get('fen') || START;

  const [startFen, setStartFen] = useState(initial);
  // Each entry: { san, from, to, fenBefore, fenAfter, by: 'you' | 'engine', rating }
  const [history, setHistory] = useState([]);
  const [fenInput, setFenInput] = useState(initial);
  const [side, setSide] = useState('white');
  const [showHint, setShowHint] = useState(true);
  const [evals, setEvals] = useState({});
  const [engineError, setEngineError] = useState(null);
  const pending = useRef({});

  const fen = history.length ? history[history.length - 1].fenAfter : startFen;
  const game = new Chess(fen);
  const turn = game.turn() === 'w' ? 'white' : 'black';
  const isUserTurn = side === 'both' || side === turn;
  const current = evals[fen];
  const lastYours = [...history].reverse().find(h => h.by === 'you');
  const last = history[history.length - 1];

  // Cached engine evaluation for a position (deduplicates parallel requests).
  function evaluate(f) {
    if (evals[f]) return Promise.resolve(evals[f]);
    if (!pending.current[f]) {
      pending.current[f] = api.evaluatePosition(f, 14)
        .then(res => {
          setEvals(e => ({ ...e, [f]: res }));
          setEngineError(null);
          return res;
        })
        .catch(err => {
          delete pending.current[f];
          setEngineError(err.message || 'Engine unavailable. Is the backend running?');
          throw err;
        });
    }
    return pending.current[f];
  }

  // Evaluate every new position; when it is the engine's turn, play its best move.
  useEffect(() => {
    let cancelled = false;
    if (game.isGameOver()) return;
    // Reply after a random 1.5-3.5s "thinking" pause (counted from the user's move) so it feels like a person.
    const thinkMs = 1500 + Math.random() * 2000;
    const started = Date.now();
    let timer;
    evaluate(fen).then(res => {
      if (cancelled || isUserTurn || !res?.bestMove) return;
      timer = setTimeout(() => {
        if (cancelled) return;
        const c = new Chess(fen);
        const mv = c.move({ from: res.bestMove.slice(0, 2), to: res.bestMove.slice(2, 4), promotion: res.bestMove[4] });
        if (mv) setHistory(h => [...h, { san: mv.san, from: mv.from, to: mv.to, fenBefore: fen, fenAfter: c.fen(), by: 'engine' }]);
      }, Math.max(0, thinkMs - (Date.now() - started)));
    }).catch(() => {});
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, side]);

  async function onMove(move, newFen) {
    const fenBefore = fen;
    const index = history.length;
    setHistory(h => [...h, { san: move.san, from: move.from, to: move.to, fenBefore, fenAfter: newFen, by: 'you', rating: null }]);
    setFenInput(newFen);
    try {
      const [before, after] = await Promise.all([evaluate(fenBefore), evaluate(newFen)]);
      const rating = classifyMove(
        { evalBefore: before.score, evalAfter: after.score, color: move.color, bestMoveSan: before.bestMoveSan },
        move.san
      );
      setHistory(h => h.map((e, i) => (i === index && e.fenAfter === newFen ? { ...e, rating, best: before.bestMoveSan } : e)));
    } catch { /* engine error is shown in the panel */ }
  }

  // Undo your last move (and the engine's reply to it) so you can try again.
  function undo() {
    setHistory(h => {
      let n = h.length;
      if (n && h[n - 1].by === 'engine' && side !== 'both') n--;
      if (n) n--;
      return h.slice(0, n);
    });
  }

  function changeSide(next) {
    setSide(next);
    setHistory([]);
  }

  function loadFen() {
    try {
      new Chess(fenInput);
      setStartFen(fenInput);
      setHistory([]);
    } catch {
      addToast({ type: 'error', message: 'That FEN is not valid.' });
    }
  }

  function pgn() {
    const c = new Chess(startFen);
    history.forEach(m => c.move(m.san));
    return c.pgn();
  }

  function copy(text, label) {
    navigator.clipboard.writeText(text).then(() => addToast({ type: 'success', message: `${label} copied` }));
  }

  // Board colouring: last move tinted by its rating, hint arrow for the suggested move.
  const squareStyles = {};
  if (last) {
    const tone = last.by === 'you' ? last.rating?.tone : null;
    const bg = tone ? TONE_SQUARE[tone] : 'rgba(160, 155, 141, 0.35)';
    squareStyles[last.from] = { backgroundColor: bg };
    squareStyles[last.to] = { backgroundColor: bg };
  }
  const arrows = showHint && isUserTurn && current?.bestMove
    ? [{ startSquare: current.bestMove.slice(0, 2), endSquare: current.bestMove.slice(2, 4), color: 'rgba(143, 211, 160, 0.85)' }]
    : [];

  const status = game.isCheckmate()
    ? `Checkmate. ${turn === 'white' ? 'Black' : 'White'} wins.`
    : game.isDraw() ? 'Draw.' : null;

  return (
    <div className="animate-slide-up" style={{ maxWidth: 1040, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          Analysis board
          <InfoToggle label="how it works">Play a side and get a suggestion before each move and a rating after it. Undo any move to try again.</InfoToggle>
        </h1>
      </div>

      <div className="ab-sides">
        {SIDES.map(s => (
          <button key={s.key} className={`btn btn-sm ${side === s.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => changeSide(s.key)}>
            {s.label}
          </button>
        ))}
        <label className="ab-hint-toggle">
          <input type="checkbox" checked={showHint} onChange={e => setShowHint(e.target.checked)} /> Show hint arrow
        </label>
      </div>

      <div className="board-two-col">
        <div>
          <InteractiveBoard
            fen={fen}
            onMove={onMove}
            interactive={isUserTurn && !status}
            orientation={side === 'black' ? 'black' : 'white'}
            customSquareStyles={squareStyles}
            arrows={arrows}
          />
          <div className="ab-controls">
            <button className="btn btn-secondary btn-sm" onClick={undo} disabled={!history.length}>
              <Undo2 size={14} /> Undo move
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setHistory([])} disabled={!history.length}>
              <RotateCcw size={14} /> Restart
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-md">
          {/* Coach: verdict on your last move, then what to play next */}
          <div className="card move-verdict">
            {lastYours ? (
              lastYours.rating ? (
                <>
                  <div className="move-verdict-head">
                    <span className="move-light" style={{ background: TONE_COLOR[lastYours.rating.tone], boxShadow: `0 0 12px ${TONE_COLOR[lastYours.rating.tone]}` }} />
                    <div>
                      <div className="move-verdict-title" style={{ color: TONE_COLOR[lastYours.rating.tone] }}>
                        {lastYours.san} · {lastYours.rating.label}
                      </div>
                      <div className="move-verdict-sub">
                        {lastYours.rating.tone === 'good'
                          ? lastYours.rating.key === 'best' ? 'Exactly the engine\'s choice. Well played.' : 'A good move. Keep going.'
                          : `This gave away about ${Math.round(lastYours.rating.loss)}% of the winning chances.`}
                      </div>
                    </div>
                  </div>
                  {lastYours.rating.tone !== 'good' && lastYours.best && (
                    <div className="move-verdict-fix ab-fix">
                      <span>Better was <strong>{lastYours.best}</strong></span>
                      <button className="btn btn-secondary btn-sm" onClick={undo}><Undo2 size={14} /> Undo and retry</button>
                    </div>
                  )}
                </>
              ) : (
                <div className="move-verdict-head">
                  <span className="move-light" style={{ background: 'var(--text-tertiary)' }} />
                  <div className="move-verdict-sub">Checking {lastYours.san}…</div>
                </div>
              )
            ) : (
              <div className="move-verdict-head">
                <span className="move-light" style={{ background: 'var(--text-tertiary)' }} />
                <div>
                  <div className="move-verdict-title">You play {side === 'both' ? 'both sides' : side === 'white' ? 'White' : 'Black'}</div>
                  <div className="move-verdict-sub">
                    {isUserTurn ? 'Make your first move. The suggestion below shows a strong start.' : 'The engine moves first. Wait for its reply.'}
                  </div>
                </div>
              </div>
            )}

            <div className="move-verdict-next">
              {status ? (
                <strong>{status}</strong>
              ) : isUserTurn ? (
                current?.bestMoveSan
                  ? <><Lightbulb size={14} style={{ verticalAlign: '-2px', color: 'var(--accent-success)' }} /> Suggested {history.length ? 'next' : 'first'} move for {turn === 'white' ? 'White' : 'Black'}: <strong>{current.bestMoveSan}</strong></>
                  : engineError ? engineError : 'Thinking about the best move…'
              ) : (
                'Engine is thinking…'
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-title"><Cpu size={16} /> Engine</div>
            {current ? (
              <>
                <div style={{ fontSize: '0.9rem' }}>
                  Evaluation <strong>{fmtScore(current)}</strong>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}> (positive is good for White)</span>
                </div>
                {current.pv?.length > 0 && (
                  <div style={{ fontSize: '0.85rem', marginTop: 6, color: 'var(--text-secondary)' }}>
                    Main line: {current.pv.join(' ')}
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>{engineError || 'Loading…'}</p>
            )}
          </div>

          <div className="card">
            <div className="card-title">Moves</div>
            {history.length ? (
              <div className="ab-moves">
                {history.map((m, i) => (
                  <span key={i} className={`ab-move${m.by === 'engine' ? ' ab-move-engine' : ''}`}>
                    {i % 2 === 0 && <span className="text-muted">{Math.floor(i / 2) + 1}.</span>}
                    {m.san}
                    {m.rating && <span className="move-dot" style={{ background: TONE_COLOR[m.rating.tone] }} title={m.rating.label} />}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.9rem' }}>Make a move on the board.</p>
            )}
            <div className="flex gap-sm mt-md" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => copy(fen, 'FEN')}><Copy size={14} /> Copy FEN</button>
              <button className="btn btn-secondary btn-sm" onClick={() => copy(pgn(), 'PGN')}><Copy size={14} /> Copy PGN</button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Load FEN</div>
            <input className="input" value={fenInput} onChange={e => setFenInput(e.target.value)} />
            <button className="btn btn-primary btn-sm mt-md" onClick={loadFen}>Load position</button>
          </div>
        </div>
      </div>
    </div>
  );
}
