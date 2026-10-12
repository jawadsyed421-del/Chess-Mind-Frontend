import React, { useState } from 'react';
import InteractiveBoard from '../../components/Chessboard/InteractiveBoard';
import { useStore } from '../../store/useStore';
import {
  GraduationCap,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Award,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Target
} from 'lucide-react';

const gmGames = [
  {
    id: 'fischer-spassky',
    title: 'Fischer vs Spassky (1972)',
    event: 'World Championship Match',
    theme: 'Positional Pawn Structure',
    type: 'positional',
    whyStudy: 'Exemplifies how to exploit an isolated pawn structure, restrict the opponent\'s counterplay, and convert a tiny structural edge.',
    fenKeyPosition: 'r1b2rk1/pp1n1ppp/4p3/3pP3/1b1P4/1P1B1N2/P2B1PPP/R3K2R w KQ - 0 13',
    keyMove: 'Bxb4',
    learningPoint: 'Trading off Black\'s active bishop cements long-term control over dark squares while keeping Black\'s remaining bishop passive behind pawns.',
  },
  {
    id: 'carlsen-anand',
    title: 'Carlsen vs Anand (2013)',
    event: 'World Championship Match',
    theme: 'Strategic Piece Coordination',
    type: 'strategic',
    whyStudy: 'Demonstrates modern piece coordination where patient maneuvering restricts the opponent without allowing any tactical breakthroughs.',
    fenKeyPosition: '2r2rk1/1p1b1ppp/pq1ppb2/8/2PNPP2/1PN5/P2Q2PP/3R1R1K w - - 0 18',
    keyMove: 'Ne2',
    learningPoint: 'Regrouping the knight to prepare f4-f5 pawn expansion while defending the central d4 outpost from unnecessary exchanges.',
  },
  {
    id: 'kasparov-topalov',
    title: 'Kasparov vs Topalov (1999)',
    event: 'Wijk aan Zee ("Kasparov\'s Immortal")',
    theme: 'Tactical King Hunt & Forks',
    type: 'tactical',
    whyStudy: 'The gold standard of tactical vision. Shows how calculated sacrifices dismantle the opponent\'s king defense through forcing checks and forks.',
    fenKeyPosition: 'r2q1rk1/1p1nbppp/p2p1n2/3P4/3B4/1N1B4/PPP3PP/R2Q1RK1 w - - 0 14',
    keyMove: 'c4',
    learningPoint: 'c4 fortifies the central d5 wedge before unleashing the kingside storm, restricting Black from ever activating through the center.',
  },
  {
    id: 'capablanca-tartakower',
    title: 'Capablanca vs Tartakower (1924)',
    event: 'New York International',
    theme: 'Endgame Technique & Outposts',
    type: 'positional',
    whyStudy: 'A masterclass in rook endgame technique. Learn how an active king and open file control decide equal-looking endgames.',
    fenKeyPosition: '8/p4pkp/1p1r2p1/8/8/1P4P1/P2r1PKP/R3R3 w - - 0 25',
    keyMove: 'Re7',
    learningPoint: 'Re7 penetrates straight to the 7th rank, putting maximum pressure on Black\'s pawns while restricting Black\'s king.',
  }
];

export default function GrandmasterStudy() {
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [playerMove, setPlayerMove] = useState(null);
  const [isCorrectMove, setIsCorrectMove] = useState(false);
  const { addToast } = useStore();

  const activeGmGame = gmGames[selectedGameIndex];

  function handleBoardMove(move) {
    const played = move.san;
    setPlayerMove(played);
    const matched = played.toLowerCase() === activeGmGame.keyMove.toLowerCase();
    setIsCorrectMove(matched);
    setRevealed(true);

    if (matched) {
      addToast({ type: 'success', message: `Superb! You matched ${activeGmGame.title.split(' ')[0]}'s move!` });
    } else {
      addToast({ type: 'info', message: `You played ${played}. Compare with the GM decision!` });
    }
  }

  function handleSelectGame(idx) {
    setSelectedGameIndex(idx);
    setRevealed(false);
    setPlayerMove(null);
    setIsCorrectMove(false);
  }

  function handleReset() {
    setRevealed(false);
    setPlayerMove(null);
    setIsCorrectMove(false);
  }

  return (
    <div className="animate-slide-up" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header text-center">
        <span className="badge badge-positional" style={{ marginBottom: '8px' }}>
          Sprint 4 • Adaptive Grandmaster Learning
        </span>
        <h1 className="page-title">Interactive Grandmaster Study</h1>
        <p className="page-subtitle">
          Study how world champions handled the exact strategic, positional, and tactical themes detected in your game history.
        </p>
      </div>

      {/* Game Selector Tabs */}
      <div className="tabs" style={{ maxWidth: 700, margin: '0 auto var(--space-lg)' }}>
        {gmGames.map((g, idx) => (
          <button
            key={g.id}
            className={`tab ${selectedGameIndex === idx ? 'active' : ''}`}
            onClick={() => handleSelectGame(idx)}
          >
            {g.title.split(' ')[0]} ({g.theme.split(' ')[0]})
          </button>
        ))}
      </div>

      <div className="board-two-col">
        
        {/* Interactive GM Board */}
        <div>
          <InteractiveBoard
            key={activeGmGame.id + revealed + (playerMove || '')}
            fen={activeGmGame.fenKeyPosition}
            orientation="white"
            onMove={handleBoardMove}
            interactive={!revealed}
          />
        </div>

        {/* Study Information & Interactive Comparison Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="card-glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{activeGmGame.title}</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{activeGmGame.event}</div>
              </div>
              <span className={`badge badge-${activeGmGame.type}`}>{activeGmGame.theme}</span>
            </div>

            <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Why This Game Was Recommended
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                {activeGmGame.whyStudy}
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '4px' }}>
                Critical Decision Point: White to Play
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {revealed
                  ? 'Compare your decision against the Grandmaster move below.'
                  : 'Try making a move directly on the board to test your judgment!'}
              </p>
            </div>

            {/* Revealed Decision Card */}
            {revealed ? (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  background: isCorrectMove ? 'rgba(0, 230, 138, 0.1)' : 'var(--accent-primary-glow)',
                  border: `1px solid ${isCorrectMove ? 'var(--accent-success)' : 'var(--accent-primary)'}`,
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isCorrectMove ? 'var(--accent-success)' : 'var(--accent-primary)', fontWeight: 700 }}>
                    {isCorrectMove ? <CheckCircle2 size={18} /> : <Award size={18} />}
                    <span>Grandmaster Move: {activeGmGame.keyMove}</span>
                  </div>

                  {playerMove && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      You played: <strong style={{ color: isCorrectMove ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{playerMove}</strong>{' '}
                      {isCorrectMove ? '— Perfect execution!' : '— A solid attempt.'}
                    </div>
                  )}

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginTop: '10px' }}>
                    Coaching Takeaway
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.45 }}>
                    {activeGmGame.learningPoint}
                  </p>
                </div>

                <button
                  className="btn btn-secondary w-full"
                  onClick={handleReset}
                  style={{ gap: '6px' }}
                >
                  <RotateCcw size={14} /> Try Another Idea on this Position
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary w-full"
                  onClick={() => setRevealed(true)}
                  style={{ gap: '6px' }}
                >
                  <HelpCircle size={16} />
                  <span>Reveal Grandmaster Move</span>
                </button>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '14px', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>
              Adaptive Recommendation Logic
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Grandmaster studies are chosen based on matching pawn structures and strategic dilemmas identified in your recent game losses.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
