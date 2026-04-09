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
import './styles/theme.css';

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
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {user && <Navbar />}

      <main id="main-content" role="main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/forecasting" element={<ProtectedRoute><Forecasting /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;