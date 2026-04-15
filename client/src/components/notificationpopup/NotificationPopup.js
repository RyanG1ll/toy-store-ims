import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './NotificationPopup.css';

function NotificationPopup() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications?unread_only=true');
        if (res.data.length > 0) {
          setNotifications(res.data.slice(0, 5)); // show top 5 unread
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Failed to fetch unread notifications:', err);
      }
    };
    fetchUnread();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'low_stock': return '📦';
      case 'new_order': return '🛒';
      case 'order_status': return '🔄';
      case 'delivery': return '🚚';
      case 'new_product': return '✨';
      default: return '🔔';
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen || notifications.length === 0) return null;

  return (
    <div className="notification-popup" role="dialog" aria-label="Unread notifications">
      <div className="popup-header">
        <h3>You have {notifications.length} unread message{notifications.length !== 1 ? 's' : ''}</h3>
        <button
          className="popup-close"
          onClick={handleClose}
          aria-label="Close notifications popup"
        >
          ×
        </button>
      </div>

      <div className="popup-list">
        {notifications.map((n) => (
          <div key={n.notification_id} className={`popup-item severity-${n.severity}`}>
            <div className="popup-item-icon" aria-hidden="true">{getIcon(n.type)}</div>
            <div className="popup-item-content">
              <div className="popup-item-title">{n.title}</div>
              <div className="popup-item-message">{n.message}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="popup-footer">
        <button className="popup-view-all" onClick={handleViewAll}>
          View All Messages
        </button>
      </div>
    </div>
  );
}

export default NotificationPopup;