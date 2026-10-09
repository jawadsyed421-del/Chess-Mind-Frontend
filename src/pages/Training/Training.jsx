import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import InteractiveBoard from '../../components/Chessboard/InteractiveBoard';
import { useStore } from '../../store/useStore';
import {
  Target,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Sparkles,
  Award,
  HelpCircle,
  BookOpen,
  GraduationCap
} from 'lucide-react';

// Curated practice positions for personalized training across all themes
const sampleExercises = [
  {
    id: 'fork-1',
    theme: 'Fork',
    type: 'tactical',
    fen: 'r1bqk2r/pppp1ppp/2n5/4p3/2B1n3/2P2N2/PPP2PPP/R1BQK2R w KQkq - 0 6',
    instruction: 'White to move. Capitalize on Black\'s unprotected knight and vulnerable pawn structure.',
    solutionSan: 'Qd5',
    explanation: 'Qd5 creates a double attack (fork) on the knight on e4 and threatens checkmate on f7!',
  },
  {
    id: 'pin-1',
    theme: 'Pin',
    type: 'tactical',
    fen: 'r1b1k2r/ppp2ppp/2n1pq2/8/1b1PP3/2N2N2/PPP3PP/R1BQKB1R w KQkq - 1 7',
    instruction: 'White to move. Neutralize the pin and maintain central pawn security.',
    solutionSan: 'Bg5',
    explanation: 'Bg5 attacks Black\'s queen, seizing the initiative and dissolving Black\'s pressure.',
  },
  {
    id: 'hanging-1',
    theme: 'Hanging Pieces',
    type: 'tactical',
    fen: 'r1bq1rk1/ppp2ppp/2np1n2/4p3/1b2P3/2NP1N2/PPPBBPPP/R2QK2R w KQ - 0 7',
    instruction: 'White to move. Black left their b4 bishop vulnerable after knight repositioning.',
    solutionSan: 'Nd5',
    explanation: 'Nd5 challenges the bishop and activates the knight into the center.',
  },
  {
    id: 'weak-sq-1',
    theme: 'Weak Squares',
    type: 'positional',
    fen: 'r1bq1rk1/pp2bppp/2n1pn2/3p4/2PP4/2N2NP1/PP2BP1P/R1BQ1RK1 w - - 0 9',
    instruction: 'White to move. Establish outposts and fight for central square control.',
    solutionSan: 'c5',
    explanation: 'c5 fixes Black\'s queenside structure and clamps down on the b6 square.',
  },
  {
    id: 'pawn-struct-1',
    theme: 'Pawn Structures',
    type: 'positional',
    fen: 'r1b2rk1/pp1n1ppp/4p3/3pP3/1b1P4/1P1B1N2/P2B1PPP/R3K2R w KQ - 0 13',
    instruction: 'White to move. Remove Black\'s defender and control the dark-squared blockade.',
    solutionSan: 'Bxb4',
    explanation: 'Bxb4 trades off the annoying active bishop and seals White\'s grip over the weak c5/d4 pawn chain.',
  },
  {
    id: 'coordination-1',
    theme: 'Piece Coordination',
    type: 'strategic',
    fen: '2r2rk1/1p1b1ppp/pq1ppb2/8/2PNPP2/1PN5/P2Q2PP/3R1R1K w - - 0 18',
    instruction: 'White to move. Regroup pieces to coordinate against Black\'s kingside weaknesses.',
    solutionSan: 'Ne2',
    explanation: 'Ne2 regroups to support central pawn pushes while defending the key d4 sector.',
  }
];

export default function Training() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { recordTrainingAttempt, currentFocus, addToast } = useStore();

  const customFen = searchParams.get('fen');
  const customBetterMove = searchParams.get('betterMove');
  const customTheme = searchParams.get('theme');
  const customType = searchParams.get('type');

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [status, setStatus] = useState('thinking'); // 'thinking', 'correct', 'incorrect'
  const [feedback, setFeedback] = useState(null);
  const [exerciseList, setExerciseList] = useState(sampleExercises);

  useEffect(() => {
    if (customFen && customBetterMove) {
      // Prepend the user's actual game mistake as exercise #1
      const userMistakeExercise = {
        id: 'user-mistake',
        theme: customTheme || 'Own Mistake',
        type: customType || 'tactical',
        fen: customFen,
        instruction: 'This position is from your actual game! What would you play now?',
        solutionSan: customBetterMove,
        explanation: `Playing ${customBetterMove} was the engine recommendation to solve the problem in this position.`,
      };
      setExerciseList([userMistakeExercise, ...sampleExercises]);
      setCurrentExerciseIndex(0);
      setStatus('thinking');
      setFeedback(null);
    }
  }, [customFen, customBetterMove, customTheme, customType]);

  const currentExercise = exerciseList[currentExerciseIndex] || exerciseList[0];

  function handleUserMove(move) {
    if (status === 'correct') return;

    const playedSan = move.san;
    const isCorrect = playedSan.toLowerCase() === currentExercise.solutionSan.toLowerCase();

    // Record in adaptive training history
    recordTrainingAttempt({
      exerciseId: currentExercise.id,
      theme: currentExercise.theme,
      type: currentExercise.type,
      solutionSan: currentExercise.solutionSan,
      playedSan,
      isCorrect,
      title: currentExercise.instruction,
    });

    if (isCorrect) {
      setStatus('correct');
      setFeedback({
        title: 'Spot on! That is the best move.',
        text: currentExercise.explanation,
      });
      addToast({ type: 'success', message: 'Correct move! Profile updated.' });
    } else {
      setStatus('incorrect');
      setFeedback({
        title: 'Not quite the optimal continuation.',
        text: `You played ${playedSan}. Try to look for a move that addresses the ${currentExercise.theme.toLowerCase()} theme.`,
      });
    }
  }

  function handleNextExercise() {
    if (currentExerciseIndex < exerciseList.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setStatus('thinking');
      setFeedback(null);
    } else {
      addToast({ type: 'success', message: 'Training session complete! Profile updated.' });
      navigate('/profile');
    }
  }

  function handleRetry() {
    setStatus('thinking');
    setFeedback(null);
  }

  return (
    <div className="animate-slide-up" style={{ maxWidth: 960, margin: '0 auto' }}>
      <div className="page-header text-center">
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className={`badge badge-${currentExercise.type}`}>
            {currentExercise.type} training
          </span>
          <span className="badge badge-complete">
            Theme: {currentExercise.theme}
          </span>
        </div>
        <h1 className="page-title">Personalized Improvement Training</h1>
        <p className="page-subtitle">
          {currentExercise.instruction}
        </p>
      </div>

      <div className="board-two-col">
        
        {/* Interactive Board */}
        <div>
          <InteractiveBoard
            key={currentExercise.id + status}
            fen={currentExercise.fen}
            orientation="white"
            onMove={handleUserMove}
            interactive={status !== 'correct'}
          />
        </div>

        {/* Feedback / Instructions Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="card-glass">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Target size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>Exercise {currentExerciseIndex + 1} of {exerciseList.length}</span>
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '16px' }}>
              Make your move on the board. Drag or click the piece to test your idea.
            </p>

            {/* Status Feedback Card */}
            {status === 'correct' && (
              <div className="animate-fade-in" style={{
                background: 'rgba(0, 230, 138, 0.1)',
                border: '1px solid var(--accent-success)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-success)', fontWeight: 700, fontSize: '1.05rem' }}>
                  <CheckCircle2 size={20} />
                  <span>{feedback.title}</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '8px' }}>
                  {feedback.text}
                </p>
              </div>
            )}

            {status === 'incorrect' && (
              <div className="animate-fade-in" style={{
                background: 'rgba(255, 92, 92, 0.1)',
                border: '1px solid var(--accent-danger)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-danger)', fontWeight: 700, fontSize: '1.05rem' }}>
                  <XCircle size={20} />
                  <span>{feedback.title}</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '8px' }}>
                  {feedback.text}
                </p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleRetry}
                  style={{ marginTop: '12px', gap: '6px' }}
                >
                  <RotateCcw size={14} /> Try Again
                </button>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              {status === 'correct' ? (
                <>
                  <button
                    className="btn btn-primary w-full"
                    onClick={handleNextExercise}
                    style={{ gap: '8px' }}
                  >
                    <span>Next Practice Position</span>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    className="btn btn-secondary w-full"
                    onClick={() => navigate('/grandmaster')}
                    style={{ gap: '8px' }}
                  >
                    <GraduationCap size={16} />
                    <span>See How a Grandmaster Plays This Theme</span>
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-secondary w-full"
                  onClick={() => {
                    setStatus('correct');
                    setFeedback({
                      title: 'Solution Revealed',
                      text: `The best move was ${currentExercise.solutionSan}. ${currentExercise.explanation}`,
                    });
                  }}
                  style={{ gap: '6px' }}
                >
                  <HelpCircle size={16} />
                  <span>Reveal Solution</span>
                </button>
              )}
            </div>
          </div>

          {/* Core Learning Flow Info */}
          <div className="card" style={{ padding: '14px', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>
              Core Learning Flow
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              My Mistake → Understand → Try Again → Similar Position → Grandmaster Example → Practice → Improve
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
