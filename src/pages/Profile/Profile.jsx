import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import Tip from '../../components/Tip/Tip';
import {
  User,
  LogOut,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  History,
  Flame,
  Settings as SettingsIcon,
} from 'lucide-react';
import { platformName, practiceStreak } from '../../utils/gameInsights';

const CATEGORIES = [
  { key: 'tactical', label: 'Tactical', desc: 'more than 2 pawns lost', color: 'var(--tactical-color)' },
  { key: 'positional', label: 'Positional', desc: '1.0–2.0 pawns lost', color: 'var(--positional-color)' },
  { key: 'strategic', label: 'Strategic', desc: '0.4–1.0 pawns lost', color: 'var(--strategic-color)' },
];

function StatusTag({ status }) {
  if (status === 'Needs Practice') {
    return <span className="pf-status pf-status-bad"><AlertCircle size={13} /> Needs practice</span>;
  }
  if (status === 'Improving') {
    return <span className="pf-status pf-status-up"><TrendingUp size={13} /> Improving</span>;
  }
  return <span className="pf-status pf-status-good"><CheckCircle2 size={13} /> Strong</span>;
}

export default function Profile() {
  const navigate = useNavigate();
  const { account, profile, stats, games, weaknesses, trainingHistory, currentFocus, disconnect } = useStore();

  if (!account) {
    return (
      <div className="empty-state animate-slide-up">
        <User size={40} style={{ color: 'var(--text-tertiary)' }} />
        <h2 className="empty-state-title">No Profile Connected</h2>
        <p className="empty-state-desc">
          Connect your Chess.com or Lichess account to unlock your personalized weakness profile.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/connect')}>
          Connect Profile
        </button>
      </div>
    );
  }

  const analysed = games.filter(g => g.analysis_status === 'complete').length;
  const displayName = profile?.name || profile?.username || account.username;
  const ratings = Object.entries(stats || {}).filter(([, v]) => v?.rating);
  const streak = practiceStreak(trainingHistory);

  const focusCategory = CATEGORIES.find(c =>
    (weaknesses?.[c.key] || []).some(i => i.name === currentFocus)
  );

  return (
    <div className="pf animate-slide-up">
      <div className="pf-top">
        <h1 className="page-title">Profile</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/settings')}>
            <SettingsIcon size={14} /> Settings
          </button>
          <button className="btn btn-ghost btn-sm" onClick={disconnect}>
            <LogOut size={14} /> Disconnect
          </button>
        </div>
      </div>

      <div className="pf-identity">
        {profile?.avatar ? (
          <img className="pf-avatar" src={profile.avatar} alt="" />
        ) : (
          <div className="pf-avatar pf-avatar-fallback">{displayName[0]?.toUpperCase()}</div>
        )}
        <div>
          <h2 className="pf-name">{displayName}</h2>
          <div className="pf-meta">
            <span className="pf-platform">{platformName(account.platform)}</span>
            <span className="pf-username">{account.username}</span>
            {ratings.map(([k, v]) => (
              <span key={k} className="pf-rating">
                <span style={{ textTransform: 'capitalize' }}>{k}</span> <strong>{v.rating}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="pf-stats">
        <div>
          <div className="pf-stat-label">Games analysed</div>
          <div className="pf-stat-value">{analysed}</div>
          <div className="pf-stat-sub">by Stockfish · {games.length} imported</div>
        </div>
        <div>
          <div className="pf-stat-label">Current focus</div>
          <div className="pf-stat-value pf-stat-text">{currentFocus}</div>
          <div className="pf-stat-sub">{focusCategory?.label || 'Overall'}</div>
        </div>
        <div>
          <div className="pf-stat-label">Exercises</div>
          <div className="pf-stat-value">{trainingHistory.length}</div>
          <div className="pf-stat-sub">
            {trainingHistory.length ? `${trainingHistory.filter(t => t.isCorrect).length} solved` : 'none yet'}
          </div>
        </div>
        <div>
          <div className="pf-stat-label"><Flame size={13} /> Streak</div>
          <div className="pf-stat-value">{streak.current}d</div>
          <div className="pf-stat-sub">best {streak.best} day{streak.best === 1 ? '' : 's'}</div>
        </div>
      </div>

      <div className="pf-section-head">
        <h2>Weaknesses by category</h2>
        <span>{analysed ? `from ${analysed} analysed game${analysed === 1 ? '' : 's'}` : 'analyse games to refine'}</span>
      </div>

      <div className="pf-weak-grid">
        {CATEGORIES.map(cat => {
          const items = weaknesses?.[cat.key] || [];
          const total = items.reduce((s, i) => s + (i.errorsCount || 0), 0);
          const max = Math.max(1, ...items.map(i => i.errorsCount || 0));
          const needs = items.filter(i => i.status === 'Needs Practice').length;
          const catStatus = needs > items.length / 2 ? 'Needs Practice' : needs ? 'Improving' : 'Strong';
          const perGame = analysed ? (total / analysed).toFixed(1) : total;

          return (
            <div key={cat.key} className="pf-weak-col">
              <div className="pf-weak-head">
                <span className="pf-weak-title"><span className="pf-dot" style={{ background: cat.color }} />{cat.label}</span>
                <span className="pf-weak-right"><StatusTag status={catStatus} /><Tip label={`What ${cat.label} means`}>{cat.desc}</Tip></span>
              </div>
              <div className="pf-weak-rate">
                <strong>{perGame}</strong> {analysed ? 'per game' : 'mistakes found'}
              </div>
              {[...items].sort((a, b) => (b.errorsCount || 0) - (a.errorsCount || 0)).map(item => (
                <div key={item.id} className="pf-weak-item">
                  <div className="pf-weak-row">
                    <span>{item.name}</span>
                    <span className="pf-weak-count">{item.errorsCount || 0}×</span>
                    <StatusTag status={item.status} />
                  </div>
                  <div className="pf-bar">
                    <div style={{ width: `${((item.errorsCount || 0) / max) * 100}%`, background: cat.color }} />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="pf-section-head">
        <h2><History size={18} /> Training history</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/training')}>
          Practise now <ChevronRight size={14} />
        </button>
      </div>

      {trainingHistory.length === 0 ? (
        <p className="pf-empty">No practice drills completed yet.</p>
      ) : (
        <div className="pf-history">
          {trainingHistory.slice(0, 8).map(record => (
            <div key={record.id} className="pf-history-row">
              {record.isCorrect
                ? <CheckCircle2 size={18} style={{ color: 'var(--accent-success)' }} />
                : <XCircle size={18} style={{ color: 'var(--accent-danger)' }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{record.theme} drill</div>
                <div className="pf-stat-sub">
                  Played <code>{record.playedSan}</code> · Solution <code>{record.solutionSan}</code>
                </div>
              </div>
              <span className="pf-stat-sub">
                {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
