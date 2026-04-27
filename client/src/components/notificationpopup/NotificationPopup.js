import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './NotificationPopup.css';

function NotificationPopup() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const seenIdsRef = useRef(new Set());
  const initialLoadRef = useRef(true);
  const navigate = useNavigate();

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

  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get('/notifications?unread_only=true');
      const unread = res.data;

      if (initialLoadRef.current) {
        // First load — show the sidebar popup, seed seen IDs
        initialLoadRef.current = false;
        unread.forEach(n => seenIdsRef.current.add(n.notification_id));
        if (unread.length > 0) {
          setNotifications(unread.slice(0, 5));
          setIsOpen(true);
        }
      } else {
        // Subsequent polls — only show toasts for genuinely new notifications
        const newOnes = unread.filter(n => !seenIdsRef.current.has(n.notification_id));
        if (newOnes.length > 0) {
          newOnes.forEach(n => seenIdsRef.current.add(n.notification_id));
          setToasts(prev => [...prev, ...newOnes.map(n => ({ ...n, id: n.notification_id }))]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch unread notifications:', err);
    }
  }, []);

  // Initial fetch + polling every 15 seconds
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Auto-dismiss toasts after 6 seconds
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      // Mark the oldest toast as read on the backend, then remove it
      const oldest = toasts[0];
      api.put(`/notifications/${oldest.id}/read`).catch(() => {});
      setToasts(prev => prev.slice(1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const dismissToast = (id) => {
    // Mark as read on the backend so it doesn't come back
    api.put(`/notifications/${id}/read`).catch(() => {});
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleToastClick = (id) => {
    api.put(`/notifications/${id}/read`).catch(() => {});
    setToasts(prev => prev.filter(t => t.id !== id));
    navigate('/notifications');
  };

  const handleViewAll = () => {
    // Mark all shown notifications as read so they don't pop up again
    notifications.forEach(n => {
      api.put(`/notifications/${n.notification_id}/read`).catch(() => {});
    });
    setIsOpen(false);
    navigate('/notifications');
  };

  const handleClose = () => {
    // Mark all shown notifications as read so they don't reappear
    notifications.forEach(n => {
      api.put(`/notifications/${n.notification_id}/read`).catch(() => {});
    });
    setIsOpen(false);
  };

  return (
    <>
      {/* Initial unread popup (top-right, shown on login) */}
      {isOpen && notifications.length > 0 && (
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
      )}

      {/* Live toast notifications (top-right, shown when new ones arrive) */}
      {toasts.length > 0 && (
        <div className="toast-container" aria-live="polite" aria-label="New notifications">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast-notification severity-${toast.severity}`}>
              <button
                className="toast-body"
                onClick={() => handleToastClick(toast.id)}
                aria-label={`${toast.title} — click to view`}
              >
                <span className="toast-icon" aria-hidden="true">{getIcon(toast.type)}</span>
                <div className="toast-content">
                  <div className="toast-title">{toast.title}</div>
                  <div className="toast-message">{toast.message}</div>
                </div>
              </button>
              <button
                className="toast-dismiss"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default NotificationPopup;
