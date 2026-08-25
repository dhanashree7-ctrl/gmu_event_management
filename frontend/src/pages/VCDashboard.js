
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import theme from '../theme';

const s = (...styles) => Object.assign({}, ...styles);

export default function VCDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('Dashboard');

  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchPending = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/get_pending_events.php?status=pending_vc`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPendingEvents(json.data);
        } else {
          console.error('get_pending_events error:', json.message);
        }
      } catch (err) {
        console.error('Failed to fetch pending events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  const handleAction = async (eventId, newStatus) => {
    setActionLoading((prev) => ({ ...prev, [eventId]: true }));
    try {
      const res = await fetch(`${API_BASE}/update_event_status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, new_status: newStatus }),
      });
      const json = await res.json();

      if (json.success) {
        setPendingEvents((prev) => prev.filter((e) => e.id !== eventId));
        const verb = newStatus === 'rejected' ? 'rejected ' : 'approved ';
        setToast({ type: 'success', message: `"${json.event_title || 'Event'}" has been ${verb}.` });
      } else {
        setToast({ type: 'error', message: json.message || 'Action failed.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Network error.' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <DashboardLayout role="vc" activeNav={activeNav} onNavChange={setActiveNav}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          {toast && (
            <div style={s(styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError)}>
              {toast.message}
              <button onClick={() => setToast(null)} style={styles.toastClose}>&times;</button>
            </div>
          )}

          <div style={styles.cardsGrid}>
            {loading ? <p>Loading...</p> : pendingEvents.length === 0 ? (
              <div style={styles.emptyState}>No pending events.</div>
            ) : (
              pendingEvents.map((evt) => (
                <div key={evt.id} style={styles.eventCard}>
                  <div style={styles.cardMeta}>
                    <span style={styles.categoryChip}>{evt.category}</span>
                    <span style={styles.cardDate}>{evt.created_at || 'TBD'}</span>
                  </div>
                  <h3 style={styles.cardTitle}>{evt.event_title}</h3>
                  <div style={styles.cardDetails}>
                    <div style={styles.cardDetailItem}><span>Department:</span> <span>{evt.department}</span></div>
                    <div style={styles.cardDetailItem}><span>Budget:</span> <span>₹{Number(evt.budget || 0).toLocaleString('en-IN')}</span></div>
                  </div>
                  <div style={styles.cardActions}>
                    <button
                      style={s(styles.actionBtn, styles.approveBtn, actionLoading[evt.id] && styles.actionBtnDisabled)}
                      onClick={() => handleAction(evt.id, 'approved')}
                      disabled={actionLoading[evt.id]}
                    >
                      {actionLoading[evt.id] ? '...' : 'Approve'}
                    </button>
                    <button
                      style={s(styles.actionBtn, styles.rejectBtn, actionLoading[evt.id] && styles.actionBtnDisabled)}
                      onClick={() => handleAction(evt.id, 'rejected')}
                      disabled={actionLoading[evt.id]}
                    >
                      {actionLoading[evt.id] ? '...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
    </DashboardLayout>
  );
}

const styles = {
  root: { display: 'flex', height: '100vh', background: '#F5F3ED', fontFamily: theme.fonts.sansSerif },
  sidebar: { width: '260px', background: theme.colors.maroon, color: '#fff', display: 'flex', flexDirection: 'column', padding: '1.5rem', flexShrink: 0 },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' },
  sidebarCrest: { fontSize: '2rem', color: theme.colors.gold },
  sidebarLogoName: { fontFamily: theme.fonts.serif, fontSize: '1.1rem', fontWeight: theme.fontWeights.bold, color: '#fff', margin: 0 },
  sidebarLogoSub: { fontSize: '0.75rem', color: '#ffb3b3', margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase' },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  navItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: theme.radii.md, cursor: 'pointer', transition: theme.transitions.fast, color: '#f0d9d9' },
  navItemActive: { background: 'rgba(255, 255, 255, 0.1)', color: '#fff', fontWeight: theme.fontWeights.bold },
  sidebarUserCard: { background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: theme.radii.md, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' },
  userName: { margin: 0, fontSize: '0.9rem', fontWeight: theme.fontWeights.bold, color: '#fff' },
  userRole: { margin: 0, fontSize: '0.75rem', color: theme.colors.gold },
  logoutBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.75rem', borderRadius: theme.radii.md, cursor: 'pointer', transition: theme.transitions.fast, width: '100%', fontSize: '0.85rem' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topBar: { background: '#fff', borderBottom: '1px solid #EAE6DE', padding: '1.25rem 2.5rem', display: 'flex', alignItems: 'center' },
  topBarTitle: { fontFamily: theme.fonts.serif, fontSize: '1.5rem', margin: 0, color: theme.colors.maroon },
  content: { flex: 1, padding: '2.5rem', overflowY: 'auto' },
  toast: { padding: '1rem 1.5rem', borderRadius: theme.radii.md, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', boxShadow: theme.shadows.md },
  toastSuccess: { background: '#E8F5E9', color: '#1B5E20', border: '1px solid #C8E6C9' },
  toastError: { background: '#FFEBEE', color: '#B71C1C', border: '1px solid #FFCDD2' },
  toastClose: { marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1.1rem' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' },
  eventCard: { background: '#fff', borderRadius: theme.radii.xl, padding: '1.5rem', boxShadow: theme.shadows.sm, border: '1px solid #ede9e3', display: 'flex', flexDirection: 'column', gap: '1rem' },
  cardMeta: { display: 'flex', justifyContent: 'space-between' },
  categoryChip: { background: theme.colors.goldLight, color: '#7a4a00', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold' },
  cardDate: { fontSize: '0.75rem', color: theme.colors.midGray },
  cardTitle: { fontFamily: theme.fonts.serif, margin: 0, fontSize: '1.2rem', color: theme.colors.charcoal },
  cardDetails: { borderTop: '1px solid #f0ede8', borderBottom: '1px solid #f0ede8', padding: '0.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  cardDetailItem: { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: theme.colors.darkGray },
  cardActions: { display: 'flex', gap: '0.75rem' },
  actionBtn: { flex: 1, padding: '0.65rem', borderRadius: '999px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' },
  approveBtn: { background: '#E8F5E9', color: '#1B5E20' },
  rejectBtn: { background: '#FFEBEE', color: '#B71C1C' },
  actionBtnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  emptyState: { background: '#fff', padding: '3rem', borderRadius: theme.radii.xl, textAlign: 'center', color: theme.colors.midGray, gridColumn: '1 / -1' }
};
