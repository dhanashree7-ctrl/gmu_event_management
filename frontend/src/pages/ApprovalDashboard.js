import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';
import theme from '../theme';
import NotificationBell from '../components/NotificationBell';

const s = (...styles) => Object.assign({}, ...styles.filter(Boolean));

export default function ApprovalDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPendingEvents();
    // eslint-disable-next-line
  }, []);

  const fetchPendingEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/get_pending_events.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role: user.role, 
          department_name: user.department_name 
        })
      });
      const json = await res.json();
      if (json.success) {
        setEvents(json.data);
      } else {
        setError(json.message);
      }
    } catch (err) {
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (eventId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this event?`)) return;

    try {
      const res = await fetch(`${API_BASE}/update_event_status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          role: user.role,
          department_name: user.department_name,
          action: action // 'approve' or 'reject'
        })
      });
      const json = await res.json();
      if (json.success) {
        // Remove event from the list after successful action
        setEvents(events.filter(e => e.id !== eventId));
      } else {
        alert('Error: ' + json.message);
      }
    } catch (err) {
      alert('Network error while processing approval.');
    }
  };

  const getRoleTitle = (role) => {
    const titles = {
      hod: 'HOD Dashboard',
      director: 'Director Dashboard',
      dean: 'Dean Dashboard',
      pro_vc: 'Pro VC Dashboard',
      provc: 'Pro VC Dashboard'
    };
    return titles[role] || 'Approval Dashboard';
  };

  return (
    <div style={styles.layout}>
      {/* ── Sidebar ── */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <span style={styles.logo}>GMU</span>
          <span style={styles.brandName}>EventMgr</span>
        </div>
        
        <nav style={styles.nav}>
          <button style={s(styles.navItem, styles.navItemActive)}>
            📋 <span style={styles.navLabel}>Pending Approvals</span>
          </button>
        </nav>

        <div style={{ flex: 1 }} />
        
        <div style={styles.userCard}>
          <div style={styles.userAvatar}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{user?.name}</div>
            <div style={styles.userRole}>{getRoleTitle(user?.role)}</div>
          </div>
        </div>
        
        <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>
          Log Out
        </button>
      </aside>

      {/* ── Main Content ── */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>{getRoleTitle(user?.role)}</h1>
            <p style={styles.pageSubtitle}>Review and approve pending event requests.</p>
          </div>
          <NotificationBell />
        </header>

        <div style={styles.content}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: theme.colors.midGray }}>Loading events...</div>
          ) : error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#d32f2f' }}>Error: {error}</div>
          ) : events.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: '3rem' }}>🎉</span>
              <h3 style={{ margin: '16px 0 8px', color: '#333' }}>No Pending Events</h3>
              <p style={{ margin: 0, color: theme.colors.midGray }}>You are all caught up!</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {events.map(ev => (
                <div key={ev.id} style={styles.eventCard}>
                  <div style={styles.eventCardHeader}>
                    <h3 style={styles.eventTitle}>{ev.event_title}</h3>
                    <span style={styles.badge}>{ev.category}</span>
                  </div>
                  <div style={styles.eventDetails}>
                    <p><strong>Proposed by:</strong> {ev.proposed_by} ({ev.department})</p>
                    <p><strong>Scale:</strong> {ev.event_scale}</p>
                    <p><strong>Budget:</strong> ₹{ev.budget}</p>
                    <p><strong>Description:</strong> {ev.description}</p>
                  </div>
                  <div style={styles.actionRow}>
                    <button 
                      style={s(styles.btn, styles.rejectBtn)}
                      onClick={() => handleApprovalAction(ev.id, 'reject')}
                    >
                      ✕ Reject
                    </button>
                    <button 
                      style={s(styles.btn, styles.approveBtn)}
                      onClick={() => handleApprovalAction(ev.id, 'approve')}
                    >
                      ✓ Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: theme.colors.background,
    fontFamily: theme.fonts.body,
  },
  sidebar: {
    width: '260px',
    background: theme.colors.maroon,
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem',
    boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '3rem',
  },
  logo: {
    background: theme.colors.gold,
    color: theme.colors.maroon,
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: theme.fontWeights.bold,
    fontSize: '1.2rem',
  },
  brandName: {
    fontSize: '1.4rem',
    fontWeight: theme.fontWeights.bold,
    letterSpacing: '0.5px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.875rem 1rem',
    borderRadius: theme.radii.md,
    color: 'rgba(255,255,255,0.7)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: theme.fontWeights.medium,
    transition: theme.transitions.fast,
    textAlign: 'left',
  },
  navItemActive: {
    background: 'rgba(255,255,255,0.1)',
    color: theme.colors.gold,
  },
  userCard: {
    background: 'rgba(0,0,0,0.2)',
    borderRadius: theme.radii.lg,
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    background: theme.colors.gold,
    color: theme.colors.maroon,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: theme.fontWeights.bold,
    fontSize: '1.2rem',
  },
  userName: {
    fontWeight: theme.fontWeights.semiBold,
    fontSize: '0.95rem',
  },
  userRole: {
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'capitalize',
  },
  logoutBtn: {
    padding: '0.875rem',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: theme.radii.md,
    cursor: 'pointer',
    fontWeight: theme.fontWeights.semiBold,
    transition: theme.transitions.fast,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    background: '#fff',
    padding: '1.5rem 2.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
  },
  pageTitle: {
    margin: 0,
    fontSize: '1.8rem',
    color: theme.colors.maroon,
  },
  pageSubtitle: {
    margin: '4px 0 0',
    color: theme.colors.midGray,
    fontSize: '0.95rem',
  },
  content: {
    flex: 1,
    padding: '2.5rem',
    overflowY: 'auto',
    background: '#f8f9fa',
  },
  emptyState: {
    background: '#fff',
    padding: '4rem 2rem',
    borderRadius: theme.radii.lg,
    textAlign: 'center',
    boxShadow: theme.shadows.sm,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1.5rem',
  },
  eventCard: {
    background: '#fff',
    borderRadius: theme.radii.lg,
    padding: '1.5rem',
    boxShadow: theme.shadows.sm,
    border: '1px solid rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  eventCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
    paddingBottom: '1rem',
  },
  eventTitle: {
    margin: 0,
    fontSize: '1.25rem',
    color: theme.colors.maroon,
    fontWeight: theme.fontWeights.bold,
  },
  badge: {
    background: 'rgba(193,127,36,0.1)',
    color: '#C17F24',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: theme.fontWeights.bold,
    textTransform: 'uppercase',
  },
  eventDetails: {
    fontSize: '0.95rem',
    color: '#444',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  actionRow: {
    display: 'flex',
    gap: '1rem',
    marginTop: 'auto',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(0,0,0,0.05)',
  },
  btn: {
    flex: 1,
    padding: '0.75rem',
    border: 'none',
    borderRadius: theme.radii.md,
    fontWeight: theme.fontWeights.bold,
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: theme.transitions.fast,
  },
  approveBtn: {
    background: '#E8F5E9',
    color: '#2E7D32',
  },
  rejectBtn: {
    background: '#FFEBEE',
    color: '#C62828',
  }
};
