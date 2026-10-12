import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { finishLichessLogin } from '../../services/lichessAuth';
import { useAuth } from '../../store/useAuth';
import { useStore } from '../../store/useStore';
import api from '../../services/api';

// Landing page for Lichess's redirect: signs in (if needed), connects the verified account and imports games.
export default function LichessCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const { username, ownershipToken, next } = await finishLichessLogin(params);
        const auth = useAuth.getState();
        if (!auth.user || auth.user.provider === 'guest') {
          if (!auth.user) auth.loginWithLichess(username);
        }
        const store = useStore.getState();
        const conn = await api.connectProfile('lichess', username, ownershipToken);
        store.setAccount({ platform: 'lichess', username: conn.profile.username, verified: true, ownershipToken });
        store.setProfile(conn.profile);
        store.setStats(conn.stats);
        store.addToast({ type: 'success', message: `Verified as ${conn.profile.username}. Importing games...` });
        api.fetchGames('lichess', conn.profile.username, 50)
          .then(r => store.setGames(r.games || []))
          .catch(err => store.addToast({ type: 'error', message: err.message }));
        navigate(next, { replace: true });
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [params, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card card-glass" style={{ textAlign: 'center' }}>
        {error ? (
          <>
            <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>
            <Link to="/login" className="btn btn-primary">Back to sign in</Link>
          </>
        ) : (
          <><div className="spinner" style={{ margin: '0 auto 12px' }} /><p>Verifying your Lichess account...</p></>
        )}
      </div>
    </div>
  );
}
