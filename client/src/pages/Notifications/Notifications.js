import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const params = filter === 'unread' ? '?unread_only=true' : '';
      const res = await api.get(`/notifications${params}`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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

  const timeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }

  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleDismiss = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }

  };

  const handleClearRead = async () => {
    try {      
      await api.delete('/notifications/clear/read');
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    }

  };

  const handleClick = async (notification) => {
    if (!notification.is_read) {
      await handleMarkRead(notification.notification_id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const filteredNotifications = filter === 'all'
    ? notifications
    : filter === 'unread'
      ? notifications
      : notifications.filter(n => n.severity === filter);

  if (loading) return <p>Loading notifications...</p>;

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <div className="notifications-actions">
          <button onClick={handleMarkAllRead} aria-label="Mark all notifications as read">
            Mark All Read
          </button>
          <button onClick={handleClearRead} aria-label="Clear all read notifications">
            Clear Read
          </button>
        </div>
      </div>

      <div className="notifications-filters" role="group" aria-label="Filter notifications">
        {['all', 'unread', 'critical', 'warning', 'info'].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="empty-notifications">
          <div className="empty-icon" aria-hidden="true">🔔</div>
          <p>No notifications to show</p>
        </div>
      ) : (
        <div className="notification-list" role="list" aria-label="Notifications">
          {filteredNotifications.map((n) => (
            <div
              key={n.notification_id}
              className={`notification-item ${!n.is_read ? 'unread' : ''}`}
              onClick={() => handleClick(n)}
              role="listitem"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleClick(n)}
              aria-label={`${!n.is_read ? 'Unread: ' : ''}${n.title} - ${n.message}`}
            >
              <div className={`notification-icon ${n.severity}`} aria-hidden="true">
                {getIcon(n.type)}
              </div>
              <div className="notification-content">
                <div className="notification-title">
                  {n.title}
                  <span className={`severity-badge ${n.severity}`}>{n.severity}</span>
                </div>
                <div className="notification-message">{n.message}</div>
                <div className="notification-time">{timeAgo(n.created_at)}</div>
              </div>
              <button
                className="notification-dismiss"
                onClick={(e) => handleDismiss(n.notification_id, e)}
                aria-label={`Dismiss notification: ${n.title}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;