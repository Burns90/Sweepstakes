import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SweepstakeProvider } from './contexts/SweepstakeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Home } from './pages/Home';
import { CreateSweepstake } from './pages/CreateSweepstake';
import { JoinSweepstake } from './pages/JoinSweepstake';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { PlayerDashboard } from './pages/PlayerDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SweepstakeProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-sweepstake"
              element={
                <ProtectedRoute>
                  <CreateSweepstake />
                </ProtectedRoute>
              }
            />
            <Route
              path="/join"
              element={
                <ProtectedRoute>
                  <JoinSweepstake />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sweepstake/:sweepstakeId"
              element={
                <ProtectedRoute>
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sweepstake/:sweepstakeId/player"
              element={
                <ProtectedRoute>
                  <PlayerDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/home" />} />
          </Routes>
        </SweepstakeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
