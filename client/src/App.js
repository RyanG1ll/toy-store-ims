import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import Suppliers from './pages/Suppliers/Suppliers';
import Orders from './pages/Orders/Orders';
import Login from './pages/Auth/Login';
import Notifications from './pages/Notifications/Notifications';
import Forecasting from './pages/Forecasting/Forecasting';
import NotificationPopup from './components/notificationpopup/NotificationPopup';
import './styles/theme.css';
import { AccessibilityProvider } from './context/AccessibilityContext';
import Settings from './pages/Settings/Settings';
import { LiveAnnouncerProvider } from './components/LiveAnnouncer';
import SkipLink from './components/SkipLink';

// Protected route wrapper — redirects to login if not authenticated
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { user } = useAuth();

  return (
    <>
      <SkipLink />

      {user && <Navbar />}
      {user && <NotificationPopup />}

      <main id="main-content" role="main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/forecasting" element={<ProtectedRoute><Forecasting /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </main>
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