import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import {
  Home,
  Link2,
  Gamepad2,
  BarChart3,
  Target,
  GraduationCap,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home', section: 'main' },
  { path: '/connect', icon: Link2, label: 'Connect Profile', section: 'main' },
  { path: '/games', icon: Gamepad2, label: 'My Games', section: 'main' },
  { path: '/analysis', icon: BarChart3, label: 'Game Analysis', section: 'learn' },
  { path: '/training', icon: Target, label: 'Training', section: 'learn' },
  { path: '/grandmaster', icon: GraduationCap, label: 'GM Study', section: 'learn' },
  { path: '/profile', icon: User, label: 'My Profile', section: 'account' },
];

export default function Layout({ children }) {
  const { account, sidebarOpen, toggleSidebar, closeSidebar, disconnect } = useStore();
  const location = useLocation();

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
        <div style={{ width: 40 }} />
      </div>

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

          <nav className="sidebar-nav">
            <span className="nav-section-title">Navigation</span>
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

            <span className="nav-section-title" style={{ marginTop: 8 }}>Learning</span>
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

          {account && (
            <div className="sidebar-footer">
              <div className="flex items-center gap-md mb-md">
                <div className={`platform-dot ${account.platform}`} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {account.username}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {account.platform === 'chesscom' ? 'Chess.com' : 'Lichess'}
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm w-full" onClick={disconnect}>
                <LogOut size={14} />
                Disconnect
              </button>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="app-main">
          <div className="app-background" />
          <div className="app-content animate-fade-in" key={location.pathname}>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
