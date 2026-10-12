import React, { useState, useEffect, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { RotateCw } from 'lucide-react';
import { useAuth } from '../../store/useAuth';

const BOARD_THEMES = {
  classic: { dark: '#b58863', light: '#f0d9b5' },
  green: { dark: '#769656', light: '#eeeed2' },
  blue: { dark: '#6b8cae', light: '#dee3e6' },
};

export default function InteractiveBoard({
  fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  orientation = 'white',
  onMove = null,
  interactive = true,
  arrows = [],
  customSquareStyles = {},
  boardWidth = null,
}) {
  const [game, setGame] = useState(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  });

  const boardTheme = useAuth(st => st.settings.boardTheme);
  const colors = BOARD_THEMES[boardTheme] || BOARD_THEMES.classic;
  const [boardOrientation, setBoardOrientation] = useState(orientation);
  const [moveFrom, setMoveFrom] = useState('');
  const [possibleMoves, setPossibleMoves] = useState([]);

  // Keep game synchronized with external fen changes
  useEffect(() => {
    try {
      const newGame = new Chess(fen);
      setGame(newGame);
      setMoveFrom('');
      setPossibleMoves([]);
    } catch (e) {
      console.error('Invalid FEN passed to InteractiveBoard:', fen, e);
    }
  }, [fen]);

  useEffect(() => {
    setBoardOrientation(orientation);
  }, [orientation]);

  function makeAMove(move) {
    if (!interactive) return null;
    try {
      const gameCopy = new Chess(game.fen());
      const result = gameCopy.move(move);
      if (result) {
        setGame(gameCopy);
        setMoveFrom('');
        setPossibleMoves([]);
        if (onMove) {
          onMove(result, gameCopy.fen());
        }
        return result;
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  // react-chessboard v5 onPieceDrop receives ({ piece, sourceSquare, targetSquare })
  function onPieceDrop({ piece, sourceSquare, targetSquare }) {
    if (!interactive || !sourceSquare || !targetSquare) return false;
    
    const isPawn = piece?.pieceType?.toLowerCase()?.includes('p') || piece?.pieceType === 'P';
    const isPromotion = isPawn && (targetSquare[1] === '8' || targetSquare[1] === '1');

    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: isPromotion ? 'q' : undefined,
    });

    return move !== null;
  }

  // Support click-to-move
  function onSquareClick({ square }) {
    if (!interactive || !square) return;

    // Deselect if clicked same square
    if (moveFrom === square) {
      setMoveFrom('');
      setPossibleMoves([]);
      return;
    }

    // If source square is already selected, try to move to target square
    if (moveFrom) {
      const legalMoves = game.moves({ square: moveFrom, verbose: true });
      const found = legalMoves.find(m => m.to === square);

      if (found) {
        makeAMove({
          from: moveFrom,
          to: square,
          promotion: found.promotion || (found.piece === 'p' && (square[1] === '8' || square[1] === '1') ? 'q' : undefined),
        });
        return;
      }
    }

    // Check if clicked square has a piece belonging to the active player
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setMoveFrom(square);
      const legalMoves = game.moves({ square, verbose: true });
      setPossibleMoves(legalMoves.map(m => m.to));
    } else {
      setMoveFrom('');
      setPossibleMoves([]);
    }
  }

  function toggleOrientation() {
    setBoardOrientation(prev => (prev === 'white' ? 'black' : 'white'));
  }

  // Merge custom styles with click-to-move highlights
  const mergedSquareStyles = useMemo(() => {
    const styles = { ...customSquareStyles };

    if (moveFrom) {
      styles[moveFrom] = {
        backgroundColor: 'rgba(255, 215, 0, 0.45)',
        boxShadow: 'inset 0 0 8px rgba(255, 215, 0, 0.8)',
      };
    }

    possibleMoves.forEach(sq => {
      const hasTargetPiece = game.get(sq);
      styles[sq] = {
        background: hasTargetPiece
          ? 'radial-gradient(circle, rgba(235, 77, 75, 0.7) 80%, transparent 85%)'
          : 'radial-gradient(circle, rgba(99, 102, 241, 0.5) 26%, transparent 30%)',
        cursor: 'pointer',
      };
    });

    return styles;
  }, [customSquareStyles, moveFrom, possibleMoves, game]);

  // react-chessboard v5 options object
  const chessboardOptions = useMemo(() => ({
    position: game.fen(),
    boardOrientation: boardOrientation,
    allowDragging: interactive,
    onPieceDrop: onPieceDrop,
    onSquareClick: onSquareClick,
    squareStyles: mergedSquareStyles,
    arrows: arrows,
    darkSquareStyle: { backgroundColor: colors.dark },
    lightSquareStyle: { backgroundColor: colors.light },
    boardStyle: {
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    },
    animationDurationInMs: 200,
  }), [game, boardOrientation, interactive, mergedSquareStyles, arrows, colors]);

  return (
    <div
      className="chess-board-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: boardWidth || 520,
        margin: '0 auto',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', touchAction: 'none' }}>
        <Chessboard options={chessboardOptions} />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px',
      }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: game.turn() === 'w' ? '#fff' : '#333',
            border: '1px solid var(--border-default)',
          }} />
          <span>{game.turn() === 'w' ? "White to move" : "Black to move"}</span>
        </div>

        <button
          onClick={toggleOrientation}
          className="btn btn-ghost btn-sm"
          style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
          title="Flip Board"
        >
          <RotateCw size={14} /> Flip
        </button>
      </div>
    </div>
  );
}
