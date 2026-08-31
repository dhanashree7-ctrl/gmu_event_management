/**
 * components/NotificationBell.js
 * ─────────────────────────────────────────────────────────────────
 * [FIREBASE MIGRATION — PHASE 1]
 * The Bell Icon renders a dropdown pop-up.
 * SQL polling (get_notifications.php) has been REMOVED.
 * Notifications are now fed via Firebase Cloud Messaging (FCM).
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import { Bell, MessageSquare, CheckCircle } from 'lucide-react';
import { manualRequestFcmToken } from '../hooks/useFCMNotifications';

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

  // ── Local notification state (fed by FCM in Phase 4) ─────────────
  // TODO [Phase 4]: Replace this local state with notifications received
  // via the Firebase onMessage() listener.
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [bellSeen, setBellSeen] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('Notification' in window ? Notification.permission : 'denied');
  const dropdownRef = useRef(null);
  const prevCountRef = useRef(0);

  // ── Listen for FCM messages dispatched from the service worker ───
  // TODO [Phase 4]: Wire this up to the real Firebase onMessage handler.
  // For now, we listen for a custom DOM event 'fcm_notification' dispatched
  // by the Firebase integration layer.
  useEffect(() => {
    const handleFcmMessage = (event) => {
      const { title, body, id } = event.detail || {};
      if (!title && !body) return;
      const newNotif = {
        id: id || Date.now(),
        message: body || title || 'New notification',
        created_at: new Date().toISOString(),
      };
      setNotifications(prev => [newNotif, ...prev]);
      setIsShaking(true);
      setBellSeen(false);
      setTimeout(() => setIsShaking(false), 700);
      prevCountRef.current += 1;
    };

    window.addEventListener('fcm_notification', handleFcmMessage);
    return () => window.removeEventListener('fcm_notification', handleFcmMessage);
  }, []);

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

  // ── Dismiss a single notification from the dropdown ──────────────
  const handleDismiss = (e, notifId) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    prevCountRef.current = Math.max(0, prevCountRef.current - 1);
  };

  // ── Dismiss ALL from bell ────────────────────────────────────────
  const handleDismissAll = () => {
    setNotifications([]);
    prevCountRef.current = 0;
    setIsOpen(false);
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
            {notifications.length > 0 && (
              <button onClick={handleDismissAll} style={styles.markAllBtn}>
                Dismiss all
              </button>
            )}
          </div>

          {/* Body */}
          <div style={styles.dropdownBody}>
            {notifications.length === 0 ? (
              <div style={styles.emptyState}>
                {permissionStatus !== 'granted' ? (
                  <>
                    <Bell size={32} color="#888" />
                    <p style={{ margin: '8px 0 0', color: '#888', fontSize: '0.9rem' }}>Enable push notifications to stay updated!</p>
                    <button 
                      onClick={async () => {
                        const success = await manualRequestFcmToken(user);
                        if (success) {
                          setPermissionStatus('granted');
                        } else {
                          setPermissionStatus('denied');
                        }
                      }}
                      style={{ marginTop: '12px', background: theme.colors.maroon, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Enable Notifications
                    </button>
                  </>
                ) : (
                  <>
                    <CheckCircle size={32} color="#888" />
                    <p style={{ margin: '8px 0 0', color: '#888' }}>You're all caught up!</p>
                  </>
                )}
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  style={styles.notifItem}
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
                    onClick={(e) => handleDismiss(e, notif.id)}
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
  bellBtnActive: {
    background: '#FFF0F0',
    border: '2px solid #E53935',
    boxShadow: '0 4px 14px rgba(229,57,53,0.35)',
  },
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
    background: `linear-gradient(135deg, #8B0000 0%, #5D0000 100%)`,
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
    cursor: 'default',
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
    transition: 'color 0.2s',
  }
};
