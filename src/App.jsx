import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import ToastContainer from './components/Toast/ToastContainer';
import Home from './pages/Home/Home';
import ConnectProfile from './pages/ConnectProfile/ConnectProfile';
import Games from './pages/Games/Games';
import GameAnalysis from './pages/GameAnalysis/GameAnalysis';
import TrainingHub from './pages/Training/TrainingHub';
import Profile from './pages/Profile/Profile';
import Landing from './pages/Landing/Landing';
import AuthPage from './pages/Auth/AuthPage';
import LichessCallback from './pages/Auth/LichessCallback';
import Stats from './pages/Stats/Stats';
import Settings from './pages/Settings/Settings';
import AnalysisBoard from './pages/AnalysisBoard/AnalysisBoard';
import { useAuth } from './store/useAuth';

// Signed-out visitors are sent to sign-in; the requested destination is kept for after login.
function Protected({ children }) {
  const user = useAuth(s => s.user);
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user, settings, initAuth, authReady } = useAuth();

  useEffect(() => { initAuth(); }, [initAuth]);
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.board = settings.boardTheme;
  }, [settings.theme, settings.boardTheme]);

  if (!authReady) return null; // wait for the saved session before deciding what to show

  const guard = el => <Protected>{el}</Protected>;

  return (
    <>
      <Routes>
        <Route path="/welcome" element={<Landing />} />
        <Route path="/auth/lichess" element={<LichessCallback />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
        <Route path="/signup" element={user && user.provider !== 'guest' ? <Navigate to="/" replace /> : <AuthPage mode="signup" />} />
        <Route path="/" element={user ? guard(<Home />) : <AuthPage mode="login" />} />
        <Route path="/connect" element={guard(<ConnectProfile />)} />
        <Route path="/games" element={guard(<Games />)} />
        <Route path="/analysis" element={guard(<GameAnalysis />)} />
        <Route path="/analysis-board" element={guard(<AnalysisBoard />)} />
        <Route path="/training" element={guard(<TrainingHub />)} />
        <Route path="/review" element={<Navigate to="/training?tab=review" replace />} />
        <Route path="/grandmaster" element={<Navigate to="/training?tab=study" replace />} />
        <Route path="/stats" element={guard(<Stats />)} />
        <Route path="/profile" element={guard(<Profile />)} />
        <Route path="/settings" element={guard(<Settings />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </>
  );
}
