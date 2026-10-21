import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { cleanOpening, classifyMove } from '../../utils/gameInsights';
import { analyseGame, getCachedAnalysis } from '../../services/backgroundAnalysis';
import Tip from '../../components/Tip/Tip';
import { Chess } from 'chess.js';
import InteractiveBoard from '../../components/Chessboard/InteractiveBoard';
import api from '../../services/api';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Target,
  ArrowRight,
  Info,
  TrendingDown,
  Layers,
  Cpu,
  BarChart2,
  CheckCircle2,
  RefreshCw,
  ChevronDown
} from 'lucide-react';

export default function GameAnalysis() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { games, addToast } = useStore();

  const gameId = searchParams.get('id');
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [currentFen, setCurrentFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [identifiedMistakes, setIdentifiedMistakes] = useState([]);
  const [moveEvals, setMoveEvals] = useState({});
  const [mistakesOpen, setMistakesOpen] = useState(false);
  const loadedId = useRef(null); // game currently shown; background updates to `games` must not reset it

  // Keyboard navigation for moves
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        goToMove(currentMoveIndex - 1);
      } else if (e.key === 'ArrowRight') {
        goToMove(currentMoveIndex + 1);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMoveIndex, gameHistory]);

  // Find or fetch the game
  useEffect(() => {
    async function loadGame() {
      let targetGame = null;
      if (gameId) {
        targetGame = games.find(g => g.platform_game_id === gameId);
      } else if (games.length > 0) {
        targetGame = games[0];
      }

      // If PGN is missing, attempt to fetch from backend
      if (targetGame && !targetGame.pgn && gameId) {
        try {
          const res = await api.getGame(gameId);
          if (res?.game?.pgn) {
            targetGame = { ...targetGame, pgn: res.game.pgn };
          }
        } catch (e) {
          console.warn('Could not fetch single game PGN:', e);
        }
      }

      if (targetGame && loadedId.current !== targetGame.platform_game_id) {
        loadedId.current = targetGame.platform_game_id;
        setSelectedGame(targetGame);
        loadGamePgn(targetGame);
      }
    }
    loadGame();
  }, [gameId, games]);

  function loadGamePgn(gameData) {
    if (!gameData?.pgn) return;

    try {
      const chess = new Chess();
      chess.loadPgn(gameData.pgn);
      const history = chess.history({ verbose: true });
      setGameHistory(history);
      
      // Start at move 0
      setCurrentMoveIndex(-1);
      setCurrentFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

      // Analysis done in the background after the import is already cached: show it straight away
      setAnalyzing(false);
      setAnalysisResult(null);
      setIdentifiedMistakes([]);
      setMoveEvals({});
      const cached = getCachedAnalysis(gameData.platform_game_id);
      if (cached) {
        applyAnalysisResult(cached);
        return;
      }

      // Not analysed yet (or the background job is still on it): this joins that run or starts one
      runEngineAnalysis(gameData);
    } catch (err) {
      console.error('Error loading game PGN:', err);
      addToast({ type: 'error', message: 'Unable to parse game PGN' });
    }
  }

  function applyAnalysisResult(rawResult) {
    const result = rawResult?.analysis || rawResult || {};
    setAnalysisResult(result);
    setIdentifiedMistakes(result.mistakes || []);

    // Build move-indexed evaluation lookup
    const evals = {};
    if (result.moveEvaluations) {
      result.moveEvaluations.forEach(m => {
        evals[m.moveIndex] = {
          evalAfter: m.evalAfter,
          evalBefore: m.evalBefore,
          bestMoveSan: m.bestMoveSan,
          mate: m.mate,
          color: m.color,
        };
      });
    }
    setMoveEvals(evals);
  }

  async function runEngineAnalysis(gameData = selectedGame, force = false) {
    if (!gameData?.pgn) return;

    const id = gameData.platform_game_id;
    setAnalyzing(true);
    try {
      const result = await analyseGame(gameData, { force });
      if (loadedId.current !== id) return; // the user moved on to another game meanwhile
      applyAnalysisResult(result);
      if (force) {
        addToast({ type: 'success', message: `Engine analysis complete! Found ${result.analysis.mistakes?.length || 0} mistake(s).` });
      }
    } catch (err) {
      console.warn('Engine analysis failed:', err);
      if (loadedId.current === id) {
        addToast({ type: 'error', message: err.message || 'Engine analysis failed. Try Re-analyze Game.' });
      }
    } finally {
      if (loadedId.current === id) setAnalyzing(false);
    }
  }

  function goToMove(index) {
    if (index < -1 || index >= gameHistory.length) return;
    setCurrentMoveIndex(index);

    if (index === -1) {
      setCurrentFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    } else {
      setCurrentFen(gameHistory[index].after);
    }
  }

  const activeMistake = identifiedMistakes.find(m => m.moveIndex === currentMoveIndex);
  const currentEval = currentMoveIndex >= 0 ? moveEvals[currentMoveIndex] : null;
  const rateMove = i => classifyMove(moveEvals[i], gameHistory[i]?.san);
  const currentRating = currentMoveIndex >= 0 ? rateMove(currentMoveIndex) : null;
  const nextBest = moveEvals[currentMoveIndex + 1]?.bestMoveSan;
  const TONE_COLOR = { good: 'var(--accent-success)', warn: 'var(--accent-warning)', bad: 'var(--accent-danger)' };

  // Calculate eval bar visual height / percentage (-5 to +5 range mapped to 0-100%)
  const rawScore = currentEval?.evalAfter ?? 0;
  const clampedScore = Math.max(-5, Math.min(5, rawScore));
  const whiteAdvantagePct = Math.round(((clampedScore + 5) / 10) * 100);

  if (!selectedGame) {
    return (
      <div className="empty-state animate-slide-up">
        <Sparkles size={40} style={{ color: 'var(--accent-primary)' }} />
        <h2 className="empty-state-title">Select a Game to Analyze</h2>
        <p className="empty-state-desc">
          Choose any imported game from your profile to inspect moves, mistake diagnostics, and Stockfish alternatives.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/games')}>
          Browse My Games
        </button>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      {/* Game Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <button
            onClick={() => navigate('/games')}
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: '8px', paddingLeft: 0, gap: '4px' }}
          >
            <ChevronLeft size={16} /> Back to Games
          </button>
          <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
            {selectedGame.player_color === 'white' ? selectedGame.white_player : selectedGame.black_player} vs {selectedGame.opponent}
          </h1>
          <p className="page-subtitle">
            {cleanOpening(selectedGame.opening_name)} • Result:{' '}
            <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{selectedGame.result}</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {analyzing ? (
            <span className="badge" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} className="animate-spin" />
              Analysing this game...
            </span>
          ) : (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => runEngineAnalysis(selectedGame, true)}
              disabled={analyzing}
              style={{ gap: '6px' }}
            >
              <Cpu size={14} />
              Re-analyze Game
            </button>
          )}

          <span className="badge badge-complete" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={12} /> Stockfish WASM Multi-thread
          </span>
        </div>
      </div>

      {/* Analysis Summary Header Cards */}
      {analysisResult?.summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: 'var(--space-lg)' }}>
          <div className="card" style={{ padding: '14px' }}>
            <div className="sum-title">
              <span>Tactical Blunders</span>
              <Tip label="About tactical blunders">Moves that dropped more than 2 pawns of advantage, usually by missing a capture, fork, pin or checkmate. These cost the most, so fix them first.</Tip>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-danger)', marginTop: '2px' }}>
              {analysisResult.summary.tactical || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Eval drop &gt; 2.0 pawns</div>
          </div>

          <div className="card" style={{ padding: '14px' }}>
            <div className="sum-title">
              <span>Positional Errors</span>
              <Tip label="About positional errors">Moves that lost 1 to 2 pawns of advantage without an immediate tactic: weak pawn structure, badly placed pieces or giving up key squares.</Tip>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--positional-color)', marginTop: '2px' }}>
              {analysisResult.summary.positional || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Eval drop 1.0 – 2.0 pawns</div>
          </div>

          <div className="card" style={{ padding: '14px' }}>
            <div className="sum-title">
              <span>Strategic Errors</span>
              <Tip label="About strategic errors">Smaller slips of 0.4 to 1 pawn where the plan was off, such as trading the wrong pieces or ignoring the long-term position.</Tip>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--strategic-color)', marginTop: '2px' }}>
              {analysisResult.summary.strategic || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Eval drop 0.4 – 1.0 pawns</div>
          </div>

          <div className="card" style={{ padding: '14px' }}>
            <div className="sum-title">
              <span>Engine Assessment</span>
              <Tip label="About engine assessment">A short verdict on the whole game, based on how many mistakes the engine found and how big they were.</Tip>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.35 }}>
              {analysisResult.summary.overallAssessment || 'Analysis in progress...'}
            </div>
          </div>
        </div>
      )}

      {/* Main Analysis Layout: Board on left/center, Moves & Mistake Card on right */}
      <div className="board-two-col">
        
        {/* Left Column: Interactive Board with Eval Bar & Navigation Controls */}
        <div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
            {/* Real Stockfish Eval Bar */}
            <div
              style={{
                width: '18px',
                borderRadius: '6px',
                background: '#2b2b2b',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid var(--border-color)',
              }}
              title={`Current Evaluation: ${rawScore > 0 ? '+' : ''}${rawScore.toFixed(2)}`}
            >
              <div
                style={{
                  height: `${whiteAdvantagePct}%`,
                  background: '#f0f0f0',
                  transition: 'height 0.25s ease-out',
                  width: '100%',
                }}
              />
            </div>

            {/* Chessboard */}
            <div style={{ flex: 1 }}>
              <InteractiveBoard
                fen={currentFen}
                orientation={selectedGame.player_color || 'white'}
                interactive={false}
              />
            </div>
          </div>

          {/* Current Position Eval Badge & Replay Controls */}
          <div className="card" style={{ marginTop: 'var(--space-md)', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart2 size={16} style={{ color: 'var(--accent-primary)' }} />
                <span>Engine Evaluation:</span>
                <Tip label="About engine evaluation" align="left">The engine's score for the position in pawns. Positive means White is better, negative means Black is better. +1.00 is roughly one extra pawn. The bar beside the board shows the same thing.</Tip>
                <strong style={{ color: rawScore >= 0 ? 'var(--text-primary)' : 'var(--accent-danger)' }}>
                  {currentEval?.mate ? `Mate in ${currentEval.mate}` : `${rawScore > 0 ? '+' : ''}${rawScore.toFixed(2)}`}
                </strong>
              </div>

              {currentEval?.bestMoveSan && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                  Stockfish recommends: <strong style={{ color: 'var(--accent-success)' }}>{currentEval.bestMoveSan}</strong>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => goToMove(-1)}
                disabled={currentMoveIndex === -1}
                title="Start"
              >
                <ChevronsLeft size={18} />
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => goToMove(currentMoveIndex - 1)}
                disabled={currentMoveIndex === -1}
                title="Previous Move"
              >
                <ChevronLeft size={18} />
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.85rem', fontWeight: 600 }}>
                Move {currentMoveIndex === -1 ? '0' : Math.floor(currentMoveIndex / 2) + 1} / {Math.ceil(gameHistory.length / 2)}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => goToMove(currentMoveIndex + 1)}
                disabled={currentMoveIndex >= gameHistory.length - 1}
                title="Next Move"
              >
                <ChevronRight size={18} />
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => goToMove(gameHistory.length - 1)}
                disabled={currentMoveIndex >= gameHistory.length - 1}
                title="End"
              >
                <ChevronsRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Mistake Feedback & Move List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

          {/* Move-by-move verdict: a light per move plus the best continuation */}
          {Object.keys(moveEvals).length > 0 && (
            <div className="card move-verdict">
              <Tip className="move-verdict-tip" label="About move ratings">Each move gets a colour. Green: best, excellent or good. Amber: an inaccuracy that gave away a little. Red: a mistake or blunder that cost real winning chances. The percentage is how much your chance of winning dropped.</Tip>
              {currentMoveIndex === -1 ? (
                <div className="move-verdict-head">
                  <span className="move-light" style={{ background: 'var(--text-tertiary)' }} />
                  <div>
                    <div className="move-verdict-title">Starting position</div>
                    <div className="move-verdict-sub">Step forward to see how each move is rated.</div>
                  </div>
                </div>
              ) : currentRating ? (
                <>
                  <div className="move-verdict-head">
                    <span className="move-light" style={{ background: TONE_COLOR[currentRating.tone], boxShadow: `0 0 12px ${TONE_COLOR[currentRating.tone]}` }} />
                    <div>
                      <div className="move-verdict-title" style={{ color: TONE_COLOR[currentRating.tone] }}>
                        {Math.floor(currentMoveIndex / 2) + 1}{currentMoveIndex % 2 ? '...' : '.'} {gameHistory[currentMoveIndex]?.san} · {currentRating.label}
                      </div>
                      <div className="move-verdict-sub">
                        {currentRating.tone === 'good'
                          ? currentRating.key === 'best'
                            ? 'This is exactly what the engine would play.'
                            : 'A solid move that keeps the position under control.'
                          : `This gave away about ${Math.round(currentRating.loss)}% of the winning chances.`}
                      </div>
                    </div>
                  </div>
                  {currentRating.tone !== 'good' && currentEval?.bestMoveSan && (
                    <div className="move-verdict-fix">
                      Better was <strong>{currentEval.bestMoveSan}</strong>
                    </div>
                  )}
                </>
              ) : (
                <div className="move-verdict-sub">No engine rating for this move.</div>
              )}
              {nextBest && (
                <div className="move-verdict-next">
                  Best next move: <strong>{nextBest}</strong>
                </div>
              )}
            </div>
          )}

          {/* Active Mistake Coach Card */}
          {activeMistake ? (
            <div className="card-glass animate-fade-in" style={{
              borderLeft: `4px solid var(--${activeMistake.type}-color)`,
              boxShadow: 'var(--shadow-md)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className={`badge badge-${activeMistake.type}`}>
                  {activeMistake.type} Error (-{activeMistake.evalDrop} eval)
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px' }}>
                  Theme: {activeMistake.theme || 'Tactical Theme'}
                </span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  You Played
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-danger)' }}>
                  {activeMistake.moveSan}
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                  {activeMistake.explanation}
                </p>
              </div>

              <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Engine Better Move
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                  {activeMistake.bestMoveSan || activeMistake.betterMove}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                  {activeMistake.betterMoveExplanation}
                </p>
              </div>

              <button
                className="btn btn-primary w-full"
                onClick={() => navigate(`/training?fen=${encodeURIComponent(activeMistake.fenBefore)}&betterMove=${encodeURIComponent(activeMistake.bestMoveSan || activeMistake.betterMove)}&theme=${encodeURIComponent(activeMistake.theme || 'Tactical')}&type=${encodeURIComponent(activeMistake.type)}`)}
                style={{ gap: '8px' }}
              >
                <Target size={16} />
                <span>Practice This Mistake in Training</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Info size={18} style={{ color: 'var(--accent-primary)' }} />
                <span>
                  {identifiedMistakes.length > 0
                    ? `Open “Mistakes in this game” below to jump to what went wrong.`
                    : analyzing
                    ? 'Stockfish 19 is analyzing your moves to detect strategic, positional, and tactical inaccuracies...'
                    : 'Select a move or review detected errors below.'}
                </span>
              </div>
            </div>
          )}

          {/* Move History Grid */}
          <div className="card" style={{ maxHeight: '340px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' }}>
              Full Move List &amp; Evaluations
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: '4px', fontSize: '0.88rem' }}>
              {Array.from({ length: Math.ceil(gameHistory.length / 2) }).map((_, i) => {
                const whiteMove = gameHistory[i * 2];
                const blackMove = gameHistory[i * 2 + 1];
                const whiteIndex = i * 2;
                const blackIndex = i * 2 + 1;

                const whiteMistake = identifiedMistakes.find(m => m.moveIndex === whiteIndex);
                const blackMistake = identifiedMistakes.find(m => m.moveIndex === blackIndex);

                return (
                  <React.Fragment key={i}>
                    <span style={{ color: 'var(--text-tertiary)', alignSelf: 'center' }}>
                      {i + 1}.
                    </span>
                    
                    <span
                      onClick={() => goToMove(whiteIndex)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: currentMoveIndex === whiteIndex ? 'var(--bg-elevated)' : 'transparent',
                        boxShadow: currentMoveIndex === whiteIndex ? 'inset 0 0 0 1px var(--border-default)' : 'none',
                        fontWeight: currentMoveIndex === whiteIndex ? 700 : 400,
                      }}
                    >
                      <span>{whiteMove?.san || ''}</span>
                      {whiteMove && rateMove(whiteIndex) && (
                        <span
                          className="move-dot"
                          style={{ background: TONE_COLOR[rateMove(whiteIndex).tone] }}
                          title={rateMove(whiteIndex).label + (whiteMistake ? ` · ${whiteMistake.theme}` : '')}
                        />
                      )}
                    </span>

                    <span
                      onClick={() => blackMove && goToMove(blackIndex)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: blackMove ? 'pointer' : 'default',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: currentMoveIndex === blackIndex ? 'var(--bg-elevated)' : 'transparent',
                        boxShadow: currentMoveIndex === blackIndex ? 'inset 0 0 0 1px var(--border-default)' : 'none',
                        fontWeight: currentMoveIndex === blackIndex ? 700 : 400,
                      }}
                    >
                      <span>{blackMove?.san || ''}</span>
                      {blackMove && rateMove(blackIndex) && (
                        <span
                          className="move-dot"
                          style={{ background: TONE_COLOR[rateMove(blackIndex).tone] }}
                          title={rateMove(blackIndex).label + (blackMistake ? ` · ${blackMistake.theme}` : '')}
                        />
                      )}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          </div>


          {/* Detected mistakes: collapsed by default so the move list stays in reach */}
          {identifiedMistakes.length > 0 && (
            <div className="card mistakes-card">
              <div className="mistakes-head">
                <button
                  type="button"
                  className="mistakes-toggle"
                  onClick={() => setMistakesOpen(o => !o)}
                  aria-expanded={mistakesOpen}
                  aria-controls="mistakes-list"
                >
                  <AlertTriangle size={16} style={{ color: 'var(--strategic-color)' }} />
                  <span>Mistakes in this game ({identifiedMistakes.length})</span>
                  <ChevronDown size={18} className={`mistakes-chevron${mistakesOpen ? ' open' : ''}`} />
                </button>
                <Tip label="About mistakes in this game">Every move where the engine found a clearly better option. Pick one to jump to it on the board and read what went wrong.</Tip>
              </div>
              {mistakesOpen && (
                <div id="mistakes-list" className="mistakes-list">
                  {identifiedMistakes.map((m) => (
                    <button
                      key={m.moveIndex}
                      onClick={() => goToMove(m.moveIndex)}
                      className={`btn btn-sm btn-secondary${currentMoveIndex === m.moveIndex ? ' move-chip-active' : ''}`}
                      style={{ fontSize: '0.8rem', gap: '6px' }}
                    >
                      <span>Move {m.moveNumber}. {m.moveSan}</span>
                      <span className={`badge badge-${m.type}`} style={{ padding: '1px 6px', fontSize: '0.7rem' }}>
                        {m.theme || m.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
