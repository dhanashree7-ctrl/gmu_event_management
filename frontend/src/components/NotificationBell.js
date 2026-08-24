import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';
import theme from '../theme';
import { Bell, MessageSquare, CheckCircle } from 'lucide-react';

const s = (...styles) => Object.assign({}, ...styles.filter(Boolean));

// Inject shake + pop animations once into the document
if (!document.getElementById('notif-bell-styles')) {
  const style = document.createElement('style');
  style.id = 'notif-bell-styles';
  style.textContent = `
    @keyframes bellShake {
      0%,100%{ transform: rotate(0deg); }
      15%{ transform: rotate(15deg); }
      30%{ transform: rotate(-12deg); }
      45%{ transform: rotate(10deg); }
      60%{ transform: rotate(-8deg); }
      75%{ transform: rotate(5deg); }
    }
    @keyframes badgePop {
      0%{ transform: scale(0); }
      70%{ transform: scale(1.3); }
      100%{ transform: scale(1); }
    }
    @keyframes slideDown {
      from{ opacity:0; transform:translateY(-8px); }
      to{ opacity:1; transform:translateY(0); }
    }
    .bell-shake { animation: bellShake 0.6s ease; }
    .badge-pop  { animation: badgePop 0.35s ease forwards; }
  `;
  document.head.appendChild(style);
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [bellSeen, setBellSeen] = useState(false);
  const dropdownRef = useRef(null);
  const prevCountRef = useRef(0);

  // ── Fetch unread notifications ─────────────────────────────────
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/get_notifications.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.username, bell_only: true }),
      });
      const json = await res.json();
      if (json.success) {
        const newCount = json.data.length;
        // Shake the bell when new notifications arrive
        if (newCount > prevCountRef.current) {
          setIsShaking(true);
          setBellSeen(false); // Reset bell seen status so dot shows again
          setTimeout(() => setIsShaking(false), 700);
        }
        prevCountRef.current = newCount;
        setNotifications(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    
    // Listen for manual updates from NotificationView
    const handleUpdate = () => fetchNotifications();
    window.addEventListener('notifications_updated', handleUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications_updated', handleUpdate);
    };
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Click a single notification ────────────────────────────────
  const handleNotificationClick = async (notif) => {
    // Optimistic UI update for the bell
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    prevCountRef.current = Math.max(0, prevCountRef.current - 1);
    setIsOpen(false);
    
    // Only dismiss from the bell, do not mark as read globally
    try {
      await fetch(`${API_BASE}/dismiss_bell_notification.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notif.id }),
      });
      // Do not dispatch notifications_updated because it's still unread in the sidebar
    } catch (err) {
      console.error('Failed to dismiss notification from bell', err);
    }
    
    if (notif.target_link) {
      if (window.location.pathname === notif.target_link) {
        window.dispatchEvent(new CustomEvent('navigate_tab', { detail: 'notifications' }));
      } else {
        navigate(notif.target_link);
      }
    } else {
      window.dispatchEvent(new CustomEvent('navigate_tab', { detail: 'notifications' }));
    }
  };

  // ── Dismiss a single notification from bell ──────────────────────
  const handleDismiss = async (e, notif) => {
    e.stopPropagation(); // prevent clicking the notification
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    prevCountRef.current = Math.max(0, prevCountRef.current - 1);
    try {
      await fetch(`${API_BASE}/dismiss_bell_notification.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notif.id }),
      });
      // Do not trigger global update as this doesn't change read status
    } catch (err) {
      console.error('Failed to dismiss notification', err);
    }
  };

  // ── Dismiss ALL from bell ───────────────────────────────────────────
  const handleDismissAll = async () => {
    setNotifications([]);
    prevCountRef.current = 0;
    setIsOpen(false);
    
    try {
      await fetch(`${API_BASE}/dismiss_all_bell_notifications.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.username }),
      });
    } catch (err) {
      console.error('Failed to dismiss all notifications', err);
    }
  };

  if (!user) return null;

  const unreadCount = notifications.length;
  const hasUnread = unreadCount > 0 && !bellSeen;

  return (
    <div ref={dropdownRef} style={styles.container}>
      {/* ── Bell button ─────────────────────────────── */}
      <button
        className={isShaking ? 'bell-shake' : ''}
        style={s(styles.bellBtn, hasUnread && styles.bellBtnActive)}
        onClick={() => { setIsOpen(o => !o); setBellSeen(true); }}
        aria-label="Notifications"
      >
        <Bell size={20} strokeWidth={2.5} style={{ color: theme.colors.charcoal }} />
        {hasUnread && (
          <span className="badge-pop" style={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ────────────────────────────────── */}
      {isOpen && (
        <div className="notification-dropdown" style={styles.dropdown}>
          {/* Header */}
          <div style={styles.dropdownHeader}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Notifications</h3>
            {hasUnread && (
              <button onClick={handleDismissAll} style={styles.markAllBtn}>
                Dismiss all
              </button>
            )}
          </div>

          {/* Body */}
          <div style={styles.dropdownBody}>
            {notifications.length === 0 ? (
              <div style={styles.emptyState}>
                <CheckCircle size={32} color="#888" />
                <p style={{ margin: '8px 0 0', color: '#888' }}>You're all caught up!</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  style={styles.notifItem}
                  onClick={() => handleNotificationClick(notif)}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F5F5')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FFF8F8')}
                >
                  <div style={styles.notifDot} />
                  <div style={styles.notifIcon}><MessageSquare size={16} color={theme.colors.maroon} /></div>
                  <div style={styles.notifContent}>
                    <p style={styles.notifMessage}>{notif.message}</p>
                    <span style={styles.notifTime}>
                      {new Date(notif.created_at).toLocaleDateString([], {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <button 
                    style={styles.dismissBtn} 
                    onClick={(e) => handleDismiss(e, notif)}
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  container: {
    position: 'relative',
    zIndex: 9999,
  },
  bellBtn: {
    position: 'relative',
    background: '#fff',
    border: '1px solid #E0E0E0',
    borderRadius: '50%',
    width: '45px',
    height: '45px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
  },
  // Applied when there are unread notifications
  bellBtnActive: {
    background: '#FFF0F0',
    border: '2px solid #E53935',
    boxShadow: '0 4px 14px rgba(229,57,53,0.35)',
  },
  bellIcon: { fontSize: '1.4rem' },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    background: '#E53935',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    borderRadius: '10px',
    padding: '2px 6px',
    boxShadow: '0 2px 4px rgba(229,57,53,0.4)',
    border: '2px solid #fff',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: '0',
    width: '90vw',
    maxWidth: '320px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
    border: '1px solid #E0E0E0',
    overflow: 'hidden',
    animation: 'slideDown 0.2s ease-out forwards',
  },
  dropdownHeader: {
    background: `linear-gradient(135deg, ${theme.colors.maroon} 0%, ${theme.colors.maroonDark} 100%)`,
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  markAllBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '0.75rem',
    padding: '4px 10px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  dropdownBody: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
  emptyState: {
    padding: '2rem 1rem',
    textAlign: 'center',
  },
  notifItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '1rem',
    borderBottom: '1px solid #F0F0F0',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    backgroundColor: '#FFF8F8',
  },
  notifDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#E53935',
    flexShrink: 0,
    marginTop: '5px',
    marginRight: '8px',
  },
  notifIcon: {
    fontSize: '1.2rem',
    marginRight: '12px',
    marginTop: '2px',
  },
  notifContent: { flex: 1 },
  notifMessage: {
    margin: '0 0 6px 0',
    fontSize: '0.9rem',
    color: '#333',
    lineHeight: 1.4,
  },
  notifTime: {
    fontSize: '0.75rem',
    color: '#999',
  },
  dismissBtn: {
    background: 'transparent',
    border: 'none',
    color: '#999',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0 4px',
    marginLeft: '8px',
    transition: 'color 0.2s'
  }
};
