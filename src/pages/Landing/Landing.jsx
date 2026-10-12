import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Link2, Cpu, Brain, Target, GraduationCap, Repeat, BarChart3 } from 'lucide-react';
import InteractiveBoard from '../../components/Chessboard/InteractiveBoard';
import SocialButtons from '../Auth/SocialButtons';
import { useAuth } from '../../store/useAuth';

const steps = [
  { icon: Link2, title: 'Connect', desc: 'Link your Chess.com or Lichess username.' },
  { icon: Cpu, title: 'Import & analyse', desc: 'Recent games are imported and checked by Stockfish.' },
  { icon: Brain, title: 'Understand', desc: 'See each mistake, the better move and the lesson.' },
  { icon: Target, title: 'Practise', desc: 'Retry your positions, solve puzzles, study Grandmasters.' },
  { icon: Repeat, title: 'Repeat', desc: 'Review due positions and fetch newly played games.' },
];

const features = [
  { icon: BarChart3, title: 'Accuracy & mistakes', desc: 'Evaluation graph and tactical, positional and strategic mistake groups.' },
  { icon: Target, title: 'Targeted training', desc: 'Sessions built around your current weaknesses.' },
  { icon: GraduationCap, title: 'Grandmaster study', desc: 'Guess key moves and compare with the masters.' },
  { icon: Repeat, title: 'Review queue', desc: 'Spaced repetition on the positions you missed.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const user = useAuth(s => s.user);
  // Demo board: Scholar's-mate trap position, interactive but not graded.
  const demoFen = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';

  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="auth-logo"><span className="sidebar-logo-icon">♟</span> ChessMind</span>
        <div className="flex gap-sm">
          {user ? (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/')}>Open app</button>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Create a free account</Link>
            </>
          )}
        </div>
      </header>

      <section className="landing-hero">
        <div>
          <h1>Turn your chess mistakes into practice.</h1>
          <p className="landing-lede">
            ChessMind imports your games from Chess.com or Lichess, finds mistakes with Stockfish, and builds practice around them.
          </p>
          {!user && (
            <div className="landing-cta">
              <Link to="/signup" className="btn btn-primary btn-lg w-full">Get started — create a free account</Link>
              <SocialButtons redirectTo="/" />
            </div>
          )}
        </div>
        <div className="landing-board">
          <InteractiveBoard fen={demoFen} />
          <p className="text-muted" style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: 8 }}>Try moving a piece — this is a live board.</p>
        </div>
      </section>

      <section className="landing-section">
        <h2>How it works</h2>
        <div className="landing-grid">
          {steps.map((s, i) => (
            <div key={s.title} className="card">
              <div className="step-num">{i + 1}</div>
              <s.icon size={20} style={{ color: 'var(--accent-primary)', margin: '8px 0' }} />
              <strong>{s.title}</strong>
              <p className="text-secondary" style={{ fontSize: '0.85rem' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2>Key features</h2>
        <div className="landing-grid">
          {features.map(f => (
            <div key={f.title} className="card">
              <f.icon size={22} style={{ color: 'var(--accent-secondary)', marginBottom: 8 }} />
              <strong>{f.title}</strong>
              <p className="text-secondary" style={{ fontSize: '0.85rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>Ready to improve?</h2>
        {user ? (
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>Open the app</button>
        ) : (
          <Link to="/signup" className="btn btn-primary btn-lg">Create a free account</Link>
        )}
      </footer>
    </div>
  );
}
