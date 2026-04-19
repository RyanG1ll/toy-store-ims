import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

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
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="nav-brand">
        <NavLink to="/">Toy Store IMS</NavLink>
      </div>
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
        <span className="nav-username">{user?.username}</span>
        <button onClick={logout} className="nav-logout">Sign Out</button>
      </div>
    </nav>
  );
}

export default Navbar;

//Use this for emoji notifications
// {<NavLink to="/notifications" aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}>
//           ✉️
          