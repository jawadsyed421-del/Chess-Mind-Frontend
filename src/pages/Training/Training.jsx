import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import InteractiveBoard from '../../components/Chessboard/InteractiveBoard';
import Tip from '../../components/Tip/Tip';
import { useStore } from '../../store/useStore';
import { puzzles } from '../../data/exercises';
import { collectMistakePuzzles } from '../../services/backgroundAnalysis';
import { describeMove, explainPuzzleMove, formatLine } from '../../utils/moveExplainer';
import {
  Target,
  CheckCircle2,
  XCircle,
  ArrowRight,
  HelpCircle,
  GraduationCap,
  Lightbulb,
  Flag,
  RotateCcw,
} from 'lucide-react';

const MAX_TRIES = 3;
const HINT_LABELS = ['Hint', 'Another hint', 'Last hint'];
const FILTERS = [
  { id: 'all', label: 'Mixed' },
  { id: 'mine', label: 'From my games' },
  { id: 'combo', label: 'Combinations' },
  { id: 'king', label: 'King attacks' },
];

const strip = san => (san || '').replace(/[+#]/g, '');
const sideOf = fen => (fen.split(' ')[1] === 'b' ? 'black' : 'white');

// What kind of idea to look for, without naming the move or the theme.
function nudge(puzzle) {
  const steps = Math.ceil(puzzle.line.length / 2);
  if (puzzle.line[puzzle.line.length - 1].endsWith('#')) return 'This position ends in checkmate. Look at every check and every move that takes away the king\'s squares.';
  if (steps > 1) return `The solution takes ${steps} moves of yours, and the opponent's replies are forced. Start from the most forcing move.`;
  return 'Look at checks, captures and threats first. Only one move keeps the advantage, so check what each reply allows before you commit.';
}

function squaresOf(fen, san) {
  try {
    const m = new Chess(fen).move(san);
    return { from: m.from, to: m.to, piece: m.piece };
  } catch {
    return null;
  }
}

function SessionSummary({ results, onAgain, onProfile }) {
  const perfect = results.filter(r => r.outcome === 'perfect').length;
  const helped = results.filter(r => r.outcome === 'helped').length;
  const failed = results.filter(r => r.outcome === 'failed').length;
  return (
    <div className="empty-state animate-slide-up">
      <Target size={40} style={{ color: 'var(--accent-primary)' }} />
      <h2 className="empty-state-title">Session complete</h2>
      <p className="empty-state-desc">
        {results.length} puzzles · {perfect} solved cleanly · {helped} solved with help · {failed} missed.
        {failed > 0 && ' Missed puzzles were added to your review queue so they come back.'}
      </p>
      <div className="flex gap-md">
        <button className="btn btn-primary" onClick={onAgain}>New session</button>
        <button className="btn btn-secondary" onClick={onProfile}>View profile</button>
      </div>
    </div>
  );
}

export default function Training() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { recordTrainingAttempt, gradeReview, addReviewItem, addToast, games } = useStore();

  const customFen = searchParams.get('fen');
  const customBetterMove = searchParams.get('betterMove');
  const customTheme = searchParams.get('theme');
  const customType = searchParams.get('type');

  const [filter, setFilter] = useState('all');
  const [sessionKey, setSessionKey] = useState(0);

  // The session: a mistake sent from Game analysis first, then puzzles from the player's own games, then the curated set.
  const list = useMemo(() => {
    const mine = collectMistakePuzzles(games, 8);
    const fromUrl = customFen && customBetterMove
      ? [{
          id: `url-${customFen}`,
          fen: customFen,
          line: [customBetterMove],
          theme: customTheme || 'Your mistake',
          type: customType || 'tactical',
          source: 'A mistake from your game',
          personal: true,
        }]
      : [];
    const curated = puzzles.map(p => ({ ...p, type: 'tactical' }));
    // Shuffle the curated part so each session feels different
    const shuffled = [...curated].sort(() => Math.random() - 0.5);
    let all = [...fromUrl, ...mine, ...shuffled];
    if (filter === 'mine') all = [...fromUrl, ...mine];
    if (filter === 'combo') all = shuffled.filter(p => p.line.length >= 3);
    if (filter === 'king') all = shuffled.filter(p => ['Checkmate', 'Mating attack', 'Attack on the king'].includes(p.theme) || p.line.some(m => m.includes('+') || m.includes('#')));
    return all.slice(0, 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sessionKey, customFen, customBetterMove]);

  const [index, setIndex] = useState(0);
  const [fen, setFen] = useState(list[0]?.fen);
  const [ply, setPly] = useState(0);            // how many moves of the solution are already on the board
  const [tries, setTries] = useState(0);
  const [hints, setHints] = useState(0);
  const [status, setStatus] = useState('thinking'); // thinking | replying | solved | failed
  const [message, setMessage] = useState(null);     // { tone, title, text }
  const [boardKey, setBoardKey] = useState(0);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const replyTimer = useRef(null);

  const puzzle = list[index];

  function loadPuzzle(i) {
    clearTimeout(replyTimer.current);
    setIndex(i);
    setFen(list[i]?.fen);
    setPly(0);
    setTries(0);
    setHints(0);
    setStatus('thinking');
    setMessage(null);
    setBoardKey(k => k + 1);
  }

  // A new session (filter change, "new session" button) starts from the first puzzle
  useEffect(() => {
    setResults([]);
    setFinished(false);
    loadPuzzle(0);
    return () => clearTimeout(replyTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  // Hints get more specific each time and cost a clean solve (must stay above the early returns below)
  const hintSquares = useMemo(() => {
    const target = puzzle?.line[ply];
    if (hints < 2 || !target || status === 'solved' || status === 'failed') return {};
    const sq = squaresOf(fen, target);
    if (!sq) return {};
    const glow = { backgroundColor: 'rgba(255, 215, 0, 0.5)', boxShadow: 'inset 0 0 10px rgba(255, 215, 0, 0.9)' };
    return hints >= 3 ? { [sq.from]: glow, [sq.to]: glow } : { [sq.from]: glow };
  }, [hints, fen, puzzle, ply, status]);

  if (finished) {
    return <SessionSummary results={results} onAgain={() => { setFilter('all'); setSessionKey(k => k + 1); }} onProfile={() => navigate('/profile')} />;
  }

  if (!puzzle) {
    return (
      <div className="empty-state animate-slide-up">
        <Target size={40} style={{ color: 'var(--accent-primary)' }} />
        <h2 className="empty-state-title">No puzzles here yet</h2>
        <p className="empty-state-desc">Import and analyse your games to get puzzles built from your own mistakes, or switch to Mixed.</p>
        <button className="btn btn-primary" onClick={() => setFilter('all')}>Show mixed puzzles</button>
      </div>
    );
  }

  const myColour = sideOf(puzzle.fen);
  const myMoves = Math.ceil(puzzle.line.length / 2);
  const stepNo = Math.floor(ply / 2) + 1;
  const done = status === 'solved' || status === 'failed';
  const expected = puzzle.line[ply];

  function finishPuzzle(outcome) {
    setResults(r => [...r, { id: puzzle.id, outcome }]);
  }

  function handleUserMove(move, fenAfter) {
    if (done || status === 'replying') return;
    const correct = strip(move.san) === strip(expected);

    if (!correct) {
      const nextTries = tries + 1;
      setTries(nextTries);
      recordTrainingAttempt({
        exerciseId: puzzle.id, theme: puzzle.theme, type: puzzle.type, solutionSan: expected, playedSan: move.san, isCorrect: false,
        title: `${puzzle.theme} puzzle`,
      });
      // Tell the player what is wrong with THEIR move, never what the answer is
      const why = describeMove(fen, move.san, { you: true })?.risks[0];
      if (nextTries >= MAX_TRIES) {
        addReviewItem({ ...puzzle, solutionSan: puzzle.line[0], explanation: explainPuzzleMove(puzzle.fen, puzzle.line[0], puzzle.gap).join(' ') });
        gradeReview({ ...puzzle, solutionSan: puzzle.line[0] }, 'revealed');
        finishPuzzle('failed');
        setStatus('failed');
        setMessage({ tone: 'bad', title: 'Out of tries', text: `${move.san} was not it. The solution is shown below. This position will come back in your review queue.` });
      } else {
        setMessage({
          tone: 'bad',
          title: `${move.san} is not the move`,
          text: `${why ? `${why} ` : 'The opponent has a good answer to that. '}You have ${MAX_TRIES - nextTries} ${MAX_TRIES - nextTries === 1 ? 'try' : 'tries'} left.`,
        });
        setBoardKey(k => k + 1); // put the piece back
      }
      return;
    }

    // Correct move
    const lastMine = ply + 1 >= puzzle.line.length;
    if (lastMine) {
      const clean = tries === 0 && hints === 0;
      recordTrainingAttempt({
        exerciseId: puzzle.id, theme: puzzle.theme, type: puzzle.type, solutionSan: puzzle.line[0], playedSan: puzzle.line[0], isCorrect: true,
        title: `${puzzle.theme} puzzle`,
      });
      gradeReview({ ...puzzle, solutionSan: puzzle.line[0] }, clean ? 'first' : 'late');
      if (!clean) addReviewItem({ ...puzzle, solutionSan: puzzle.line[0], explanation: explainPuzzleMove(puzzle.fen, puzzle.line[0], puzzle.gap).join(' ') });
      finishPuzzle(clean ? 'perfect' : 'helped');
      setFen(fenAfter);
      setStatus('solved');
      setMessage({ tone: 'good', title: clean ? 'Solved with no help' : 'Solved', text: clean ? 'You found it on your own.' : 'You found it, with a little help. It will return in your review queue.' });
      return;
    }

    // More to find: the opponent answers automatically, then it is the player's turn again
    setStatus('replying');
    setMessage({ tone: 'good', title: `${move.san} is right`, text: 'Keep going. The opponent replies...' });
    replyTimer.current = setTimeout(() => {
      try {
        const c = new Chess(fenAfter);
        const reply = c.move(puzzle.line[ply + 1]);
        setFen(c.fen());
        setPly(ply + 2);
        setStatus('thinking');
        setMessage({ tone: 'good', title: `The opponent plays ${reply.san}`, text: `Find your next move (${Math.floor((ply + 2) / 2) + 1} of ${myMoves}).` });
        setBoardKey(k => k + 1);
      } catch {
        setStatus('thinking');
      }
    }, 650);
  }

  function giveUp() {
    addReviewItem({ ...puzzle, solutionSan: puzzle.line[0], explanation: explainPuzzleMove(puzzle.fen, puzzle.line[0], puzzle.gap).join(' ') });
    gradeReview({ ...puzzle, solutionSan: puzzle.line[0] }, 'revealed');
    finishPuzzle('failed');
    setStatus('failed');
    setMessage({ tone: 'bad', title: 'Solution revealed', text: 'It will come back in your review queue so you can try it again later.' });
  }

  function nextPuzzle() {
    if (index + 1 >= list.length) {
      addToast({ type: 'success', message: 'Training session complete!' });
      setFinished(true);
    } else {
      loadPuzzle(index + 1);
    }
  }

  const hintText = hints === 0 ? null
    : hints === 1 ? nudge(puzzle)
    : hints === 2 ? 'The glowing square is the piece you should move.'
    : 'Both squares glow: the piece to move and where it should go.';

  const explainPoints = done ? explainPuzzleMove(puzzle.fen, puzzle.line[0], puzzle.gap) : [];
  const solutionLine = done ? formatLine(puzzle.fen, puzzle.line) : null;
  const tone = message?.tone === 'good' ? 'var(--accent-success)' : 'var(--accent-danger)';

  return (
    <div className="animate-slide-up" style={{ maxWidth: 960, margin: '0 auto' }}>
      <div className="page-header text-center">
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <span className={`badge badge-${puzzle.type || 'tactical'}`}>{puzzle.personal ? 'From your games' : 'Tactics'}</span>
          <span className="badge badge-complete">{myMoves > 1 ? `${myMoves}-move combination` : 'Find the only move'}</span>
          {done && <span className="badge badge-complete">Theme: {puzzle.theme}</span>}
        </div>
        <h1 className="page-title">Training puzzles</h1>
        <p className="page-subtitle">
          {myColour === 'white' ? 'White' : 'Black'} to move. Find the best move{myMoves > 1 ? 's' : ''}. No hints on the board, so look carefully.
        </p>
        <div className="train-filters" role="group" aria-label="Puzzle type">
          {FILTERS.map(f => (
            <button key={f.id} className={`train-chip${filter === f.id ? ' on' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="board-two-col">
        <div>
          <InteractiveBoard
            key={`${puzzle.id}:${boardKey}`}
            fen={fen}
            orientation={myColour}
            onMove={handleUserMove}
            interactive={!done && status !== 'replying'}
            showLegalMoves={false}
            customSquareStyles={hintSquares}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="card-glass">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Target size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>Puzzle {index + 1} of {list.length}</span>
              <Tip label="How training works">You get {MAX_TRIES} tries. A wrong move is explained but the answer is never shown. Hints cost you a clean solve, and puzzles you miss or need help with come back in your review queue.</Tip>
            </h3>

            {!done && (
              <div className="train-meter" aria-label="Tries left">
                {Array.from({ length: MAX_TRIES }).map((_, i) => <span key={i} className={i < tries ? 'used' : ''} />)}
                <small>{MAX_TRIES - tries} {MAX_TRIES - tries === 1 ? 'try' : 'tries'} left{myMoves > 1 ? ` · move ${stepNo} of ${myMoves}` : ''}</small>
              </div>
            )}

            {message && (
              <div className="animate-fade-in train-msg" style={{ borderColor: tone, background: message.tone === 'good' ? 'rgba(0, 230, 138, 0.08)' : 'rgba(255, 92, 92, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: tone, fontWeight: 700 }}>
                  {message.tone === 'good' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  <span>{message.title}</span>
                </div>
                <p>{message.text}</p>
              </div>
            )}

            {hintText && !done && (
              <div className="train-hint"><Lightbulb size={15} /> <span>{hintText}</span></div>
            )}

            {done && (
              <div className="train-explain">
                <div className="why-head best"><ArrowRight size={14} /> Solution: {solutionLine}</div>
                <ul className="why-list">
                  {explainPoints.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
                {puzzle.source && <p className="why-note">Position from: {puzzle.source}</p>}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              {done ? (
                <>
                  <button className="btn btn-primary w-full" onClick={nextPuzzle} style={{ gap: '8px' }}>
                    <span>{index + 1 >= list.length ? 'Finish session' : 'Next puzzle'}</span>
                    <ArrowRight size={16} />
                  </button>
                  {status === 'solved' && (
                    <button className="btn btn-secondary w-full" onClick={() => navigate('/training?tab=study')} style={{ gap: '8px' }}>
                      <GraduationCap size={16} />
                      <span>See how a grandmaster plays this theme</span>
                    </button>
                  )}
                  {status === 'failed' && (
                    <button className="btn btn-secondary w-full" onClick={() => loadPuzzle(index)} style={{ gap: '8px' }}>
                      <RotateCcw size={16} />
                      <span>Try this one again</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button className="btn btn-secondary w-full" onClick={() => setHints(h => Math.min(3, h + 1))} disabled={hints >= 3 || status === 'replying'} style={{ gap: '6px' }}>
                    <HelpCircle size={16} />
                    <span>{hints >= 3 ? 'No more hints' : HINT_LABELS[hints]}</span>
                  </button>
                  {tries > 0 && (
                    <button className="btn btn-ghost w-full" onClick={giveUp} style={{ gap: '6px' }}>
                      <Flag size={16} />
                      <span>Give up and show the solution</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: '14px', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>
              How to think
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              List every check, capture and threat. For each one, ask what the opponent can answer. Play only when you can see why it works.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
