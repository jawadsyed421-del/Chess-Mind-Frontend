import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/useAuth';
import { useStore } from '../../store/useStore';

function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
      <div className="card-title" style={{ marginBottom: 12 }}>{title}</div>
      <div className="flex flex-col gap-md">{children}</div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, settings, updateProfile, updateSettings, setPassword, signOut, signOutOtherDevices, deleteAccount } = useAuth();
  const { account, disconnect, addToast } = useStore();

  const [name, setName] = useState(user.name || '');
  const [pw, setPw] = useState({ current: '', next: '' });
  const canPassword = user.provider === 'email' || user.provider === 'google';

  async function savePassword(e) {
    e.preventDefault();
    try {
      await setPassword(pw);
      setPw({ current: '', next: '' });
      addToast({ type: 'success', message: 'Password updated. Other devices were signed out.' });
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    }
  }

  function confirmDisconnect() {
    if (window.confirm('Disconnect this profile? Its imported games, analysis and mistakes will be removed.')) {
      disconnect();
      addToast({ type: 'info', message: 'Profile disconnected.' });
    }
  }

  function confirmDelete() {
    if (window.confirm('Permanently delete your account and all stored ChessMind data? This cannot be undone.')) {
      deleteAccount();
      navigate('/welcome', { replace: true });
    }
  }

  return (
    <div className="animate-slide-up" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">
          {user.provider === 'guest' ? 'You are a guest — create an account to keep your progress across devices.' : user.email || user.name}
        </p>
      </div>

      <Section title="Account">
        <label className="input-label">Display name</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} />
        <label className="input-label">Daily goal (practice positions)</label>
        <input className="input" type="number" min="1" max="50" value={settings.dailyGoal}
          onChange={e => updateSettings({ dailyGoal: Math.max(1, Number(e.target.value) || 1) })} />
        <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}
          onClick={() => { updateProfile({ name }); addToast({ type: 'success', message: 'Saved' }); }}>Save</button>
        {user.provider === 'guest' && (
          <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => navigate('/signup')}>
            Create account (keeps your games &amp; progress)
          </button>
        )}
      </Section>

      {canPassword && (
        <Section title="Password">
          <form onSubmit={savePassword} className="flex flex-col gap-md">
            <input className="input" type="password" placeholder="Current password (blank if none set)" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} />
            <input className="input" type="password" placeholder="New password" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} required />
            <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>Set / change password</button>
          </form>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>Changing a password signs out other devices.</p>
        </Section>
      )}

      <Section title="Chess profiles">
        {account ? (
          <div className="flex items-center gap-md" style={{ justifyContent: 'space-between' }}>
            <span>{account.username} · {account.platform === 'chesscom' ? 'Chess.com' : 'Lichess'}</span>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-danger)' }} onClick={confirmDisconnect}>Disconnect</button>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => navigate('/connect')}>Connect a profile</button>
        )}
      </Section>

      <Section title="Appearance, board &amp; sounds">
        <label className="input-label">Board colours</label>
        <select className="input" value={settings.boardTheme} onChange={e => updateSettings({ boardTheme: e.target.value })}>
          <option value="classic">Classic</option>
          <option value="green">Green</option>
          <option value="blue">Blue</option>
        </select>
        <label className="input-label">Theme</label>
        <select className="input" value={settings.theme} onChange={e => updateSettings({ theme: e.target.value })}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
        <label className="flex items-center gap-sm">
          <input type="checkbox" checked={settings.sounds} onChange={e => updateSettings({ sounds: e.target.checked })} /> Move sounds
        </label>
        <p className="text-muted" style={{ fontSize: '0.8rem' }}>Board and sound preferences are saved in this browser.</p>
      </Section>

      <Section title="Devices &amp; sign out">
        <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { signOutOtherDevices(); addToast({ type: 'success', message: 'Other devices signed out.' }); }}>Sign out other devices</button>
          <button className="btn btn-secondary btn-sm" onClick={() => { signOut(); navigate('/welcome'); }}>Sign out</button>
        </div>
      </Section>

      <Section title="Danger zone">
        <button className="btn btn-sm" style={{ alignSelf: 'flex-start', background: 'var(--accent-danger)', color: '#fff', minHeight: 44 }} onClick={confirmDelete}>Delete account</button>
      </Section>
    </div>
  );
}
