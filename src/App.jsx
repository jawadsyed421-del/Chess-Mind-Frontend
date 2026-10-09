import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import ToastContainer from './components/Toast/ToastContainer';
import Home from './pages/Home/Home';
import ConnectProfile from './pages/ConnectProfile/ConnectProfile';
import Games from './pages/Games/Games';
import GameAnalysis from './pages/GameAnalysis/GameAnalysis';
import Training from './pages/Training/Training';
import GrandmasterStudy from './pages/GrandmasterStudy/GrandmasterStudy';
import Profile from './pages/Profile/Profile';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/connect" element={<ConnectProfile />} />
        <Route path="/games" element={<Games />} />
        <Route path="/analysis" element={<GameAnalysis />} />
        <Route path="/training" element={<Training />} />
        <Route path="/grandmaster" element={<GrandmasterStudy />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </Layout>
  );
}
