import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Small eye button that reveals extra detail on click. Hidden until the user asks for it.
// Pass `block` to render the detail on its own line (use <InfoToggle.Panel> for the content).
export function useInfo() {
  const [open, setOpen] = useState(false);
  return [open, () => setOpen(o => !o)];
}

export function InfoButton({ open, onToggle, label = 'details' }) {
  const Icon = open ? EyeOff : Eye;
  return (
    <button
      type="button"
      className={`info-btn${open ? ' on' : ''}`}
      onClick={onToggle}
      aria-expanded={open}
      aria-label={`${open ? 'Hide' : 'Show'} ${label}`}
      title={`${open ? 'Hide' : 'Show'} ${label}`}
    >
      <Icon size={15} />
    </button>
  );
}

export function InfoPanel({ open, children, className = '' }) {
  if (!open) return null;
  return <div className={`info-panel ${className}`}>{children}</div>;
}

// Button + panel in one, for simple cases: <InfoToggle>detail text</InfoToggle>
// `block` makes the detail span the full width of its container (for grids of facts).
export default function InfoToggle({ children, label, block = false }) {
  const [open, toggle] = useInfo();
  return (
    <span className={`info-inline${block ? ' block' : ''}`}>
      <InfoButton open={open} onToggle={toggle} label={label} />
      <InfoPanel open={open}>{children}</InfoPanel>
    </span>
  );
}
