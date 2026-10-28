import React from 'react';
import { CheckCircle2, AlertTriangle, Lightbulb, ArrowRight, ListOrdered } from 'lucide-react';

function Points({ items, tone }) {
  if (!items?.length) return null;
  return (
    <ul className={`why-list ${tone || ''}`}>
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  );
}

// Plain-English walkthrough of one move: what it does, what it risks, why another move was better.
export default function MoveExplanation({ explain, ahead, showBetter, onToggleBetter }) {
  if (!explain && !ahead) return null;
  const hasBetter = !!explain?.best;
  const nothing = explain && !explain.played.good.length && !explain.played.risks.length;

  return (
    <div className="card why-card">
      <div className="why-title"><Lightbulb size={16} /> Why this move?</div>

      {explain && (
        <>
          {explain.verdict && <p className="why-verdict">{explain.verdict}</p>}
          {explain.evalNote && <p className="why-eval">{explain.evalNote}</p>}

          {explain.played.good.length > 0 && (
            <div className="why-block">
              <div className="why-head good"><CheckCircle2 size={14} /> What the move does</div>
              <Points items={explain.played.good.slice(0, 4)} />
            </div>
          )}

          {explain.played.risks.length > 0 && (
            <div className="why-block">
              <div className="why-head bad"><AlertTriangle size={14} /> What goes wrong</div>
              <Points items={explain.played.risks.slice(0, 3)} />
            </div>
          )}

          {nothing && (
            <p className="why-note">A quiet move: it does not win anything or create a direct threat. Quiet moves are judged by the plan behind them, such as how they improve piece placement or king safety.</p>
          )}

          {hasBetter && (
            <div className="why-block better">
              <div className="why-head best"><ArrowRight size={14} /> Why {explain.best.san} was better</div>
              <Points items={explain.best.points} />
              {explain.best.compare.map((c, i) => <p key={i} className="why-note">{c}</p>)}
              <button type="button" className="btn btn-secondary btn-sm" onClick={onToggleBetter}>
                {showBetter ? 'Back to the game position' : `Show ${explain.best.san} on the board`}
              </button>
            </div>
          )}

          {explain.reply && (
            <div className="why-block">
              <div className="why-head"><ArrowRight size={14} /> Strongest reply: {explain.reply.san}</div>
              <p className="why-note">{explain.reply.text}</p>
            </div>
          )}

          {explain.line && (
            <div className="why-block">
              <div className="why-head"><ListOrdered size={14} /> Engine line</div>
              <p className="why-line">{explain.line}</p>
              <p className="why-note">This is the sequence the engine expects if both sides play the best moves from here.</p>
            </div>
          )}
        </>
      )}

      {ahead && (
        <div className="why-block ahead">
          <div className="why-head"><Lightbulb size={14} /> Best next move: {ahead.san}</div>
          {ahead.points.length > 0
            ? <Points items={ahead.points} />
            : <p className="why-note">It improves the position without creating weaknesses.</p>}
        </div>
      )}
    </div>
  );
}
