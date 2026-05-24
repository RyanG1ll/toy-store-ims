import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        setUnreadCount(res.data.count);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menu on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && menuOpen) setMenuOpen(false);
  }, [menuOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="nav-brand">
        <NavLink to="/">Toy Store IMS</NavLink>
      </div>

      <button
        className="nav-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-expanded={menuOpen}
        aria-controls="nav-menu"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
      >
        <span className={`hamburger-icon ${menuOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      <div className={`nav-menu ${menuOpen ? 'nav-menu--open' : ''}`} id="nav-menu">
        <ul className="nav-links">
          <li><NavLink to="/" end>Dashboard</NavLink></li>
          <li><NavLink to="/products">Products</NavLink></li>
          <li><NavLink to="/suppliers">Suppliers</NavLink></li>
          <li><NavLink to="/orders">Orders</NavLink></li>
          <li><NavLink to="/forecasting">Forecasting</NavLink></li>
          <li>
            <NavLink to="/notifications" aria-label={`Messages${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}>
              Messages
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </NavLink>
          </li>
          <li><NavLink to="/settings">Settings</NavLink></li>
        </ul>
        <div className="nav-user">
          <NavLink to="/account" className="nav-username-link" aria-label="View your account details">
            {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
          </NavLink>
          <button onClick={() => { if (window.confirm('Are you sure you want to sign out?')) logout(); }} className="nav-logout">Sign Out</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

//Use this for emoji notifications
// {<NavLink to="/notifications" aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}>
//           ✉️
          