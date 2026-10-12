import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InteractiveBoard from '../../components/Chessboard/InteractiveBoard';
import { useStore } from '../../store/useStore';
import { CheckCircle2, XCircle, HelpCircle, PartyPopper } from 'lucide-react';

export default function Review() {
  const navigate = useNavigate();
  const { reviewQueue, gradeReview } = useStore();
  // Snapshot of what was due when the session started so grading doesn't reshuffle it.
  const [session] = useState(() => reviewQueue.filter(q => q.dueAt <= Date.now()));
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState('thinking');
  const [missed, setMissed] = useState(false);
  const [results, setResults] = useState([]);

  if (session.length === 0) {
    return (
      <div className="empty-state animate-slide-up">
        <PartyPopper size={40} style={{ color: 'var(--accent-success)' }} />
        <h2 className="empty-state-title">All caught up</h2>
        <p className="empty-state-desc">No positions are due. {reviewQueue.length ? `${reviewQueue.length} scheduled for later.` : 'Train to add positions to your queue.'}</p>
        <button className="btn btn-primary" onClick={() => navigate('/training')}>Go to Train</button>
      </div>
    );
  }

  if (idx >= session.length) {
    const first = results.filter(r => r === 'first').length;
    return (
      <div className="empty-state animate-slide-up">
        <h2 className="empty-state-title">Review summary</h2>
        <p className="empty-state-desc">{session.length} positions reviewed · {first} correct first try · {results.filter(r => r === 'late').length} after a miss · {results.filter(r => r === 'revealed').length} revealed</p>
        <div className="flex gap-md">
          <button className="btn btn-primary" onClick={() => navigate('/profile')}>View profile</button>
          <button className="btn btn-secondary" onClick={() => navigate('/training')}>New session</button>
        </div>
      </div>
    );
  }

  const ex = session[idx].exercise;

  function onMove(move) {
    if (status === 'correct') return;
    if (move.san.toLowerCase() === ex.solutionSan.toLowerCase()) {
      const grade = missed ? 'late' : 'first';
      gradeReview(ex, grade);
      setResults(r => [...r, grade]);
      setStatus('correct');
    } else {
      setMissed(true);
      setStatus('incorrect');
    }
  }

  function reveal() {
    gradeReview(ex, 'revealed');
    setResults(r => [...r, 'revealed']);
    setStatus('revealed');
  }

  function next() {
    setIdx(i => i + 1);
    setStatus('thinking');
    setMissed(false);
  }

  const done = status === 'correct' || status === 'revealed';

  return (
    <div className="animate-slide-up" style={{ maxWidth: 960, margin: '0 auto' }}>
      <div className="page-header text-center">
        <h1 className="page-title">Review queue</h1>
        <p className="page-subtitle">Position {idx + 1} of {session.length} · {ex.instruction}</p>
      </div>
      <div className="board-two-col">
        <InteractiveBoard key={ex.id + status} fen={ex.fen} onMove={onMove} interactive={!done} />
        <div className="card-glass">
          {status === 'incorrect' && <p style={{ color: 'var(--accent-danger)', display: 'flex', gap: 8 }}><XCircle size={18} /> Not quite — try again.</p>}
          {done && (
            <p style={{ color: 'var(--accent-success)', display: 'flex', gap: 8 }}>
              <CheckCircle2 size={18} /> {status === 'revealed' ? `Answer: ${ex.solutionSan}. ` : 'Correct! '}{ex.explanation}
            </p>
          )}
          {!done && <button className="btn btn-secondary w-full mt-md" onClick={reveal}><HelpCircle size={16} /> Reveal answer</button>}
          {done && <button className="btn btn-primary w-full mt-md" onClick={next}>{idx + 1 === session.length ? 'See summary' : 'Next position'}</button>}
        </div>
      </div>
    </div>
  );
}
