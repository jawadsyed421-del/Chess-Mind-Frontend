import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/useAuth';
import { startLichessLogin } from '../../services/lichessAuth';
import { X } from 'lucide-react';

export function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

/** Google / Lichess / guest buttons shared by landing, login and sign-up. */
export default function SocialButtons({ redirectTo = '/', onError }) {
  const navigate = useNavigate();
  const { signInWithGoogle, continueAsGuest } = useAuth();

  async function google() {
    try {
      await signInWithGoogle(redirectTo); // redirects to Google's own account chooser
    } catch (e) {
      onError?.(e.message);
    }
  }

  function guest() {
    continueAsGuest();
    navigate(redirectTo, { replace: true });
  }

  return (
    <>
      <div className="social-stack">
        <button type="button" className="btn btn-secondary btn-lg w-full social-btn google" onClick={google}>
          <GoogleIcon /> Sign in with Google
        </button>
        <button type="button" className="btn btn-secondary btn-lg w-full social-btn" onClick={() => startLichessLogin(redirectTo)}>
          <span style={{ fontSize: '1.1rem' }}>♞</span> Continue with Lichess
        </button>
        <button type="button" className="btn btn-ghost btn-lg w-full" onClick={guest}>
          Try as a guest
        </button>
      </div>
    </>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} role="dialog" aria-label={title}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <h3 style={{ marginBottom: 12 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
