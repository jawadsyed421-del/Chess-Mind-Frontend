import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/useAuth';
import { useStore } from '../../store/useStore';
import {
  Home,
  Link2,
  Gamepad2,
  BarChart3,
  Target,
  User,
  LogOut,
  Menu,
  X,
  Search,
  PieChart,
  Settings as SettingsIcon,
  Grid3x3,
} from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home', section: 'main' },
  { path: '/games', icon: Gamepad2, label: 'My games', section: 'main' },
  { path: '/stats', icon: PieChart, label: 'Stats', section: 'main' },
  { path: '/connect', icon: Link2, label: 'Connect profile', section: 'main' },
  { path: '/analysis', icon: BarChart3, label: 'Game analysis', section: 'learn' },
  { path: '/training', icon: Target, label: 'Training', section: 'learn' },
  { path: '/analysis-board', icon: Grid3x3, label: 'Analysis board', section: 'learn' },
  { path: '/profile', icon: User, label: 'Profile', section: 'account' },
  { path: '/settings', icon: SettingsIcon, label: 'Settings', section: 'account' },
];

const mobileTabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/games', icon: Gamepad2, label: 'Games' },
  { path: '/training', icon: Target, label: 'Train' },
  { path: '/stats', icon: PieChart, label: 'Stats' },
  { path: '/profile', icon: User, label: 'Profile' },
];

function QuickNav({ open, onClose }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const results = navItems.filter(i => i.label.toLowerCase().includes(q.toLowerCase()));
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <input className="input input-lg" autoFocus placeholder="Go to..." value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && results[0]) { navigate(results[0].path); onClose(); } }} />
        <div style={{ marginTop: 8 }}>
          {results.map(r => (
            <button key={r.path} className="nav-link w-full" style={{ background: 'none', border: 'none' }}
              onClick={() => { navigate(r.path); onClose(); }}>
              <r.icon size={18} /> {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const { account, sidebarOpen, toggleSidebar, closeSidebar } = useStore();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [quick, setQuick] = useState(false);

  useEffect(() => {
    const h = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setQuick(o => !o); }
      if (e.key === 'Escape') setQuick(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const mainNav = navItems.filter(i => i.section === 'main');
  const learnNav = navItems.filter(i => i.section === 'learn');
  const accountNav = navItems.filter(i => i.section === 'account');

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="hamburger-btn" onClick={toggleSidebar}>
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">♟</span>
          <span className="sidebar-logo-text">ChessMind</span>
        </div>
        <button className="hamburger-btn" onClick={() => setQuick(true)} aria-label="Search"><Search size={22} /></button>
      </div>
      <QuickNav open={quick} onClose={() => setQuick(false)} />

      {/* Mobile Overlay */}
      <div
        className={`mobile-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      />

      <div className="app-layout">
        {/* Sidebar */}
        <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="sidebar-logo-icon">♟</div>
              <span className="sidebar-logo-text">ChessMind</span>
            </div>
          </div>

          <button className="btn btn-secondary btn-sm w-full" style={{ marginBottom: 8, justifyContent: 'space-between' }} onClick={() => setQuick(true)}>
            <span className="flex items-center gap-sm"><Search size={14} /> Search</span><kbd>Ctrl K</kbd>
          </button>
          <nav className="sidebar-nav">
            <span className="nav-section-title">Overview</span>
            {mainNav.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive && location.pathname === item.path ? 'active' : ''}`
                }
                onClick={closeSidebar}
                end={item.path === '/'}
              >
                <item.icon className="nav-link-icon" size={20} />
                {item.label}
              </NavLink>
            ))}

            <span className="nav-section-title" style={{ marginTop: 8 }}>Improve</span>
            {learnNav.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
                onClick={closeSidebar}
              >
                <item.icon className="nav-link-icon" size={20} />
                {item.label}
              </NavLink>
            ))}

            <span className="nav-section-title" style={{ marginTop: 8 }}>Account</span>
            {accountNav.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
                onClick={closeSidebar}
              >
                <item.icon className="nav-link-icon" size={20} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>
              {user?.provider === 'guest' ? 'Guest' : account ? `${account.username} - ${account.platform === 'chesscom' ? 'Chess.com' : 'Lichess'}` : 'No chess profile'}
            </div>
            <button className="btn btn-ghost btn-sm w-full" onClick={() => { signOut(); navigate('/welcome'); }}>
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="app-main">
          <div className="app-background" />
          <div className="app-content animate-fade-in" key={location.pathname}>
            {children}
          </div>
        </main>
      </div>

      <nav className="mobile-tabs">
        {mobileTabs.map(t => (
          <NavLink key={t.path} to={t.path} end={t.path === '/'} className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
            <t.icon size={20} />
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
