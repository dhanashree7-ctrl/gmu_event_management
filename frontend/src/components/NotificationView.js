import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';
import theme from '../theme';

const s = (...styles) => Object.assign({}, ...styles.filter(Boolean));

export default function NotificationView() {
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/get_notifications.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.username })
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    const handleUpdate = () => fetchNotifications();
    window.addEventListener('notifications_updated', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications_updated', handleUpdate);
    };
  }, [user]);

  const handleMarkRead = async (e, notif) => {
    e.preventDefault();
    e.stopPropagation();
    // Optimistically remove from list
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    
    // Call backend to mark read
    try {
      await fetch(`${API_BASE}/mark_notification_read.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notif.id })
      });
      // Notify other components (like NotificationBell) that notifications changed
      window.dispatchEvent(new Event('notifications_updated'));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
    
  };

  const handleMarkAllRead = async () => {
    // Optimistically clear the list
    setNotifications([]);

    try {
      await fetch(`${API_BASE}/mark_all_notifications_read.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.username })
      });
      window.dispatchEvent(new Event('notifications_updated'));
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={{ ...styles.header, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={styles.title}>Your Notifications </h2>
          <p style={styles.subtitle}>You have {notifications.length} unread alerts.</p>
        </div>
        {notifications.length > 0 && (
          <button 
            type="button"
            onClick={handleMarkAllRead}
            style={{ 
              padding: '8px 16px', background: '#F5F5F5', color: '#333', 
              border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer',
              fontWeight: 500, transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e9e9e9'; e.currentTarget.style.borderColor = '#ccc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F5F5F5'; e.currentTarget.style.borderColor = '#ddd'; }}
          >
             Mark All as Read
          </button>
        )}
      </div>

      <div style={styles.list}>
        {notifications.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: '3rem' }}></span>
            <h3 style={{ margin: '16px 0 8px', color: '#333' }}>You're all caught up!</h3>
            <p style={{ margin: 0, color: '#666' }}>Check back later for updates.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} style={styles.card}>
              <div style={styles.iconWrapper}>
                <span></span>
              </div>
              <div style={styles.cardContent}>
                <p style={styles.message}>{notif.message}</p>
                <span style={styles.time}>
                  {new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button 
                type="button"
                style={styles.actionBtn}
                onClick={(e) => handleMarkRead(e, notif)}
              >
                Mark as Read
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '800px',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    margin: '0 0 0.5rem 0',
    fontSize: '2rem',
    color: theme.colors.primary,
  },
  subtitle: {
    margin: 0,
    color: '#666',
    fontSize: '1rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  emptyState: {
    padding: '4rem 2rem',
    textAlign: 'center',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    background: '#fff',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    borderLeft: `4px solid ${theme.colors.maroon}`,
  },
  iconWrapper: {
    fontSize: '1.5rem',
    marginRight: '1rem',
    background: '#FFF0F0',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
  },
  cardContent: {
    flex: 1,
  },
  message: {
    margin: '0 0 0.25rem 0',
    fontSize: '1.1rem',
    color: '#333',
    fontWeight: '500',
  },
  time: {
    fontSize: '0.85rem',
    color: '#888',
  },
  actionBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#fff',
    color: theme.colors.primary,
    border: `1px solid ${theme.colors.primary}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  }
};
