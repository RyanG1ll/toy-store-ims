import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import Suppliers from './pages/Suppliers/Suppliers';
import Orders from './pages/Orders/Orders';
import Login from './pages/Auth/Login';
import EmailVerification from './pages/Auth/EmailVerification';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import AccountDetails from './pages/Account/AccountDetails';
import Notifications from './pages/Notifications/Notifications';
import Forecasting from './pages/Forecasting/Forecasting';
import NotificationPopup from './components/notificationpopup/NotificationPopup';
import './styles/theme.css';
import { AccessibilityProvider } from './context/AccessibilityContext';
import Settings from './pages/Settings/Settings';
import { LiveAnnouncerProvider } from './components/LiveAnnouncer';
import SkipLink from './components/SkipLink';
import Tutorial from './components/tutorial/Tutorial';
import WelcomePrompt from './components/tutorial/WelcomePrompt';

// Redirects to login if not authenticated
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Show welcome prompt on first login for non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin') {
      const key = `tutorialCompleted_${user.user_id}`;
      const completed = localStorage.getItem(key);
      if (!completed) {
        setShowWelcome(true);
      }
    }
  }, [user]);

  useEffect(() => {
    const handleStart = () => {
      setShowWelcome(false);
      setShowTutorial(true);
    };
    window.addEventListener('startTutorial', handleStart);
    return () => window.removeEventListener('startTutorial', handleStart);
  }, []);

  return (
    <>
      <SkipLink />

      {user && <Navbar />}
      {user && <NotificationPopup />}

      <main id="main-content" role="main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/account" element={<ProtectedRoute><AccountDetails /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/forecasting" element={<ProtectedRoute><Forecasting /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </main>

      {/* Prompt aks new non-admin users if they've used the system */}
      {showWelcome && (
        <WelcomePrompt onResponse={(startTutorial) => {
          setShowWelcome(false);
          if (startTutorial) setShowTutorial(true);
        }} />
      )}

      {/* Step-by-step tutorial walkthrough */}
      {showTutorial && (
        <Tutorial onComplete={() => setShowTutorial(false)} />
      )}
    </>
  );
}

function App() {
  return (
    <AccessibilityProvider>
      <LiveAnnouncerProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </LiveAnnouncerProvider>
    </AccessibilityProvider>
  );
}

export default App;