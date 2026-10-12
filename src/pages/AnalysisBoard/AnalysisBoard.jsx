import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import InteractiveBoard from '../../components/Chessboard/InteractiveBoard';
import { useStore } from '../../store/useStore';
import { Copy, RotateCcw, Cpu } from 'lucide-react';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export default function AnalysisBoard() {
  const [params] = useSearchParams();
  const addToast = useStore(s => s.addToast);
  const initial = params.get('fen') || START;

  const [startFen, setStartFen] = useState(initial);
  const [fen, setFen] = useState(initial);
  const [moves, setMoves] = useState([]);
  const [fenInput, setFenInput] = useState(initial);
  const [lines, setLines] = useState(null);
  const [engineError, setEngineError] = useState(null);

  // Engine lines from Lichess's public cloud evaluation (positions it has analysed).
  useEffect(() => {
    let cancelled = false;
    setLines(null);
    setEngineError(null);
    fetch(`https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=3`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('No engine lines cached for this position.'))))
      .then(d => !cancelled && setLines(d.pvs || []))
      .catch(e => !cancelled && setEngineError(e.message || 'Engine lines unavailable.'));
    return () => { cancelled = true; };
  }, [fen]);

  function onMove(move, newFen) {
    setMoves(m => [...m, move.san]);
    setFen(newFen);
    setFenInput(newFen);
  }

  function loadFen() {
    try {
      new Chess(fenInput);
      setStartFen(fenInput);
      setFen(fenInput);
      setMoves([]);
    } catch {
      addToast({ type: 'error', message: 'That FEN is not valid.' });
    }
  }

  function pgn() {
    const c = new Chess(startFen);
    moves.forEach(m => c.move(m));
    return c.pgn();
  }

  function copy(text, label) {
    navigator.clipboard.writeText(text).then(() => addToast({ type: 'success', message: `${label} copied` }));
  }

  function reset() {
    setFen(startFen);
    setFenInput(startFen);
    setMoves([]);
  }

  function uciToSan(uci) {
    try {
      const c = new Chess(fen);
      return uci.split(' ').slice(0, 5).map(u => c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }).san).join(' ');
    } catch {
      return uci;
    }
  }

  return (
    <div className="animate-slide-up" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Analysis board</h1>
        <p className="page-subtitle">Try moves, inspect engine lines and copy FEN or PGN</p>
      </div>
      <div className="board-two-col">
        <InteractiveBoard key={fen === startFen ? startFen + moves.length : 'live'} fen={fen} onMove={onMove} />
        <div className="flex flex-col gap-md">
          <div className="card">
            <div className="card-title"><Cpu size={16} /> Engine lines</div>
            {lines === null && !engineError && <p className="text-muted">Loading…</p>}
            {engineError && <p className="text-muted" style={{ fontSize: '0.85rem' }}>{engineError}</p>}
            {lines?.map((l, i) => (
              <div key={i} style={{ fontSize: '0.85rem', marginTop: 6 }}>
                <strong>{l.mate ? `M${l.mate}` : (l.cp / 100).toFixed(2)}</strong> {uciToSan(l.moves)}
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title">Moves</div>
            <p style={{ fontSize: '0.9rem' }}>{moves.length ? moves.join(' ') : 'Make a move on the board.'}</p>
            <div className="flex gap-sm mt-md" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => copy(fen, 'FEN')}><Copy size={14} /> Copy FEN</button>
              <button className="btn btn-secondary btn-sm" onClick={() => copy(pgn(), 'PGN')}><Copy size={14} /> Copy PGN</button>
              <button className="btn btn-ghost btn-sm" onClick={reset}><RotateCcw size={14} /> Reset</button>
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
