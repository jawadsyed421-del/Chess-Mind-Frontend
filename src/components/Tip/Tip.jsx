import React, { useEffect, useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';

// Small (i) icon that explains a confusing section in a bubble.
// Opens on hover and keyboard focus; click/tap toggles it so it also works on touch screens.
// `align` is the side of the bubble that lines up with the icon ("right" suits icons at the end of a row).
export default function Tip({ children, label = 'More info', align = 'right', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return undefined;
    const close = e => { if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <span ref={ref} className={`tip tip-${align}${open ? ' open' : ''} ${className}`}>
      <button
        type="button"
        className="tip-btn"
        aria-label={label}
        aria-describedby={id}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <Info size={15} />
      </button>
      <span role="tooltip" id={id} className="tip-bubble">{children}</span>
    </span>
  );
}
