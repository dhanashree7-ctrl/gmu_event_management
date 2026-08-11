import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';
import theme from '../theme';
import AttendeeRoster from './AttendeeRoster';
import EventArchive from '../components/EventArchive';
import ReportsView from '../components/ReportsView';
import NotificationView from '../components/NotificationView';
import NotificationBell from '../components/NotificationBell';
import UserProfileDropdown from '../components/UserProfileDropdown';
import EventCalendar from '../components/EventCalendar';
import DashboardMetrics from '../components/DashboardMetrics';

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Navigation state
  const [activeNav, setActiveNav] = useState('dashboard'); // dashboard, action-center, my-proposals, approved-history
  const [collapsed, setCollapsed] = useState(false);
  
  // Tab state within My Proposals
  const [activeTab, setActiveTab] = useState('proposalsList'); // proposalsList, proposeNew
  
  // Action Center: Review Queue
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Action Center: Propose Event
  const [formData, setFormData] = useState({
    event_title: '',
    date: '',
    description: '',
    category: '',
    event_scale: '',
    event_mode: 'offline',
    budget: '',
    rewards: '',
    immediate_approval: false,
    brochureFile: null,
    approval_route: [],
    max_participants: '',
    max_volunteers: '',
    max_coordinators: '',
    is_festival: false,
    sub_events: [{ name: '', description: '' }],
    participation_type: 'solo',
    max_team_size: '',
  });
  const [proposeLoading, setProposeLoading] = useState(false);
  const [proposeMessage, setProposeMessage] = useState(null);

  // My Proposals state
  const [myEvents, setMyEvents] = useState([]);
  const [myEventsLoading, setMyEventsLoading] = useState(false);

  const [approvedEvents, setApprovedEvents] = useState([]);
  const [approvedLoading, setApprovedLoading] = useState(false);

  // System-wide events for analytics
  const [systemEvents, setSystemEvents] = useState([]);

  // Roster modal state
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [rosterEventId, setRosterEventId] = useState(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('gmu_user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      const allowedRoles = ['director', 'dean', 'pro_vc', 'provc', 'vc'];
      if (!allowedRoles.includes(parsedUser.role)) {
        navigate('/login');
      }
    } catch (e) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    
    fetchPendingEvents();
    fetchMyEvents();
    fetchApprovedHistory();
    fetchSystemEvents();
  }, [user]);

  const fetchSystemEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/get_archived_events.php?role=${user.role}`);
      const json = await res.json();
      if (json.success) {
        setSystemEvents(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load system events', err);
    }
  };

  const fetchPendingEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/get_pending_events.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: user.role })
      });
      const json = await res.json();
      if (json.success) {
        setPendingEvents(json.data || []);
      } else {
        setError(json.message || 'Failed to load pending events.');
      }
    } catch (err) {
      setError('Cannot reach server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvents = async () => {
    setMyEventsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/get_my_events.php?user_id=${user.id}`);
      const json = await res.json();
      if (json.success) {
        setMyEvents(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load my events", err);
    } finally {
      setMyEventsLoading(false);
    }
  };

  // Remarks Modal State
  const [remarksModal, setRemarksModal] = useState({ open: false, eventId: null, action: null, scale: null });
  const [remarksText, setRemarksText] = useState("");

  // Sub-Events Modal State
  const [subEventsModal, setSubEventsModal] = useState({ open: false, eventTitle: '', subEvents: [] });

  // Feedback Insights State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackEventId, setFeedbackEventId] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const categoryData = React.useMemo(() => {
    const counts = {};
    systemEvents.forEach(ev => {
      const cat = ev.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [systemEvents]);

  const fetchFeedbackData = async (eventId) => {
    setFeedbackLoading(true);
    try {
      const res = await fetch(`${API_BASE}/get_event_feedback.php?event_id=${eventId}`);
      const json = await res.json();
      if (json.success) {
        setFeedbackData(json.data);
      } else {
        setFeedbackData(null);
      }
    } catch (err) {
      console.error(err);
      setFeedbackData(null);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const fetchApprovedHistory = async () => {
    setApprovedLoading(true);
    try {
      const res = await fetch(`${API_BASE}/get_executive_approved_events.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: user.role })
      });
      const json = await res.json();
      if (json.success) {
        setApprovedEvents(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load approved history", err);
    } finally {
      setApprovedLoading(false);
    }
  };

  const submitActionWithRemarks = async (e) => {
    e.preventDefault();
    const { eventId, action, scale } = remarksModal;
    
    if (action === 'reject' && !remarksText.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/update_event_status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          event_id: eventId, 
          action: action,
          role: user.role,
          user_id: user.id,
          remarks: remarksText,
          notes: remarksText
        })
      });
      const json = await res.json();
      if (json.success) {
        setPendingEvents(pendingEvents.filter(ev => ev.id !== eventId));
        fetchApprovedHistory();
      } else {
        alert(json.message);
      }
    } catch (err) {
      alert("Action failed. Check console.");
      console.error(err);
    } finally {
      setRemarksModal({ open: false, eventId: null, action: null, scale: null });
      setRemarksText("");
    }
  };

  const handleProposeChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProposeSubmit = async (e) => {
    e.preventDefault();
    if (!formData.brochureFile) {
      alert("Please upload a brochure for the proposal.");
      return;
    }
    setProposeLoading(true);
    setProposeMessage(null);
    try {
      const fd = new FormData();
      fd.append('event_title', formData.event_title);
      fd.append('description', formData.description);
      fd.append('event_date', formData.date);
      fd.append('category', formData.category);
      fd.append('event_scale', formData.event_scale);
      fd.append('event_mode', formData.event_mode);
      fd.append('budget', formData.budget);
      if (formData.rewards) fd.append('rewards', formData.rewards);
      fd.append('immediate_approval', formData.immediate_approval);
      fd.append('proposed_by_id', user.id);
      fd.append('role', user.role);
      fd.append('brochure', formData.brochureFile);
      if (formData.max_participants) fd.append('max_participants', formData.max_participants);
      if (formData.max_volunteers) fd.append('max_volunteers', formData.max_volunteers);
      if (formData.max_coordinators) fd.append('max_coordinators', formData.max_coordinators);
      if (formData.is_festival) {
        fd.append('is_festival', 'true');
        fd.append('sub_events', JSON.stringify(formData.sub_events.filter(s => s.name.trim() !== '')));
      }
      fd.append('participation_type', formData.participation_type);
      if (formData.participation_type === 'group' && formData.max_team_size) {
        fd.append('max_team_size', formData.max_team_size);
      }

      const res = await fetch(`${API_BASE}/create_event.php`, {
        method: 'POST',
        body: fd
      });
      const json = await res.json();
      if (json.success) {
        setProposeMessage({ type: 'success', text: 'Event proposed successfully!' });
        fetchApprovedHistory();
        setFormData({ event_title: '', date: '', description: '', category: '', event_scale: '', event_mode: 'offline', budget: '',
    rewards: '', brochureFile: null, approval_route: [], max_participants: '', max_volunteers: '', max_coordinators: '', is_festival: false, sub_events: [{ name: '', description: '' }], participation_type: 'solo', max_team_size: '' });
      } else {
        setProposeMessage({ type: 'error', text: json.message || 'Failed to propose event.' });
      }
    } catch (err) {
      setProposeMessage({ type: 'error', text: 'Cannot reach server.' });
    } finally {
      setProposeLoading(false);
    }
  };

  const s = (...args) => Object.assign({}, ...args.filter(Boolean));

  if (!user) return null;

  let title = 'Executive Approval Dashboard';
  if (user.role === 'director') title = 'Director Dashboard';
  if (user.role === 'dean') title = 'Dean Dashboard';
  if (user.role === 'provc' || user.role === 'pro_vc') title = 'Pro-VC Dashboard';
  if (user.role === 'vc') title = 'VC Dashboard';

  return (
    <div style={styles.root}>
      {/* ── Left Sidebar ────────────────────────────────────────── */}
      <aside style={s(styles.sidebar, collapsed && styles.sidebarCollapsed)}>
        <div style={styles.sidebarLogo}>
          <span style={styles.sidebarCrest}>⚜</span>
          {!collapsed && (
            <div>
              <div style={styles.sidebarLogoName}>GM University</div>
              <div style={styles.sidebarLogoSub}>Event System</div>
            </div>
          )}
        </div>

        <div style={styles.divider} />

        <nav style={styles.sidebarNav}>
          <button
            onClick={() => setActiveNav('dashboard')}
            style={s(styles.navItem, activeNav === 'dashboard' && styles.navItemActive)}
          >
            <span style={styles.navIcon}>🏠</span>
            {!collapsed && <span style={styles.navLabel}>Dashboard</span>}
          </button>
          
          <button
            onClick={() => setActiveNav('action-center')}
            style={s(styles.navItem, activeNav === 'action-center' && styles.navItemActive)}
          >
            <span style={styles.navIcon}>📊</span>
            {!collapsed && (
              <span style={s(styles.navLabel, { flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                Action Center
                {(pendingEvents || []).some(e => e.immediate_approval) && (
                  <span style={{ background: '#D32F2F', color: '#FFF', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                    {(pendingEvents || []).filter(e => e.immediate_approval).length}
                  </span>
                )}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveNav('my-proposals')}
            style={s(styles.navItem, activeNav === 'my-proposals' && styles.navItemActive)}
          >
            <span style={styles.navIcon}>📝</span>
            {!collapsed && <span style={styles.navLabel}>My Proposals</span>}
          </button>
          
          <button
            onClick={() => setActiveNav('approved-history')}
            style={s(styles.navItem, activeNav === 'approved-history' && styles.navItemActive)}
          >
            <span style={styles.navIcon}>✅</span>
            {!collapsed && <span style={styles.navLabel}>Approved by Me</span>}
          </button>

          <button
            onClick={() => setActiveNav('calendar')}
            style={s(styles.navItem, activeNav === 'calendar' && styles.navItemActive)}
          >
            <span style={styles.navIcon}>📅</span>
            {!collapsed && <span style={styles.navLabel}>Calendar</span>}
          </button>
          
          <button
            onClick={() => setActiveNav('reports')}
            style={s(styles.navItem, activeNav === 'reports' && styles.navItemActive)}
          >
            <span style={styles.navIcon}>📁</span>
            {!collapsed && <span style={styles.navLabel}>Reports</span>}
          </button>
          
          <button
            onClick={() => setActiveNav('archive')}
            style={s(styles.navItem, activeNav === 'archive' && styles.navItemActive)}
          >
            <span style={styles.navIcon}>🏛️</span>
            {!collapsed && <span style={styles.navLabel}>Archive</span>}
          </button>
          
          <button
            onClick={() => setActiveNav('notifications')}
            style={s(styles.navItem, activeNav === 'notifications' && styles.navItemActive)}
          >
            <span style={styles.navIcon}>🔔</span>
            {!collapsed && <span style={styles.navLabel}>Notifications</span>}
          </button>
          
        </nav>

        <div style={{ flex: 1 }} />

        <div style={styles.sidebarUserCard}>
          <div style={styles.userAvatar}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div style={styles.userInfo}>
              <div style={styles.userName}>{user.name}</div>
              <div style={styles.userRole}>{user.role.toUpperCase()}</div>
            </div>
          )}
        </div>

        <button 
          style={styles.logoutBtn} 
          onClick={() => {
            sessionStorage.removeItem('gmu_user');
            navigate('/login');
          }}
        >
          <span style={styles.navIcon}>🚪</span>
          {!collapsed && <span>Log Out</span>}
        </button>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────── */}
      <main style={styles.main}>
        {/* Top Header Bar */}
        <header style={styles.topBar}>
          <button 
            style={styles.collapseBtn} 
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '▶' : '◀'}
          </button>
          <div style={styles.topBarCenter}>
            <div style={styles.topBarTitle}>{title}</div>
            <div style={styles.topBarSub}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NotificationBell />
            <UserProfileDropdown user={user} />
          </div>
        </header>

        {/* Scrollable Content View */}
        <div style={styles.content}>
          
          {/* Dashboard View */}
          {activeNav === 'dashboard' && (
            <div style={styles.contentCard}>
              <h2 style={styles.sectionTitle}>Dashboard</h2>
              <p style={styles.sectionSub}>Metrics & Overview</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1.5rem', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Pending Reviews</div>
                  <div style={{ fontSize: '2rem', color: theme.colors.maroon, fontWeight: 'bold' }}>{pendingEvents.length}</div>
                </div>
                <div style={{ padding: '1.5rem', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>My Approvals</div>
                  <div style={{ fontSize: '2rem', color: '#137333', fontWeight: 'bold' }}>{approvedEvents.length}</div>
                </div>
              </div>

              <DashboardMetrics 
                data={[
                  { name: 'Pending Approvals', count: pendingEvents.length },
                  { name: 'Approved Events', count: approvedEvents.length },
                  { name: 'My Proposals', count: myEvents.length }
                ]} 
                type="overview" 
                barName="Total Items"
              />
              
              {systemEvents.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h3 style={{ fontSize: '1.2rem', color: '#555', marginBottom: '1rem' }}>Global Event Distribution</h3>
                  <DashboardMetrics data={categoryData} type="category" barName="Total Events" />
                </div>
              )}
            </div>
          )}

          {/* Action Center Content */}
          {activeNav === 'action-center' && (
            <div style={styles.contentCard}>
              <div>
                    <h2 style={styles.sectionTitle}>Pending Approvals</h2>
                    <p style={styles.sectionSub}>Review event requests escalating to your office.</p>
                    {error && <div style={styles.errorBox}>{error}</div>}
                    {loading ? (
                      <p>Loading events...</p>
                    ) : pendingEvents.length === 0 ? (
                      <div style={styles.emptyState}>
                        <span style={styles.emptyIcon}>🎉</span>
                        <p style={styles.emptyText}>All caught up! No events pending your approval.</p>
                      </div>
                    ) : (
                      <div style={styles.tableWrap}>
                        <div style={s(styles.tableRow, styles.tableHeader)}>
                          <span style={s(styles.tableCell, { flex: 3 })}>Event Title</span>
                          <span style={s(styles.tableCell, { flex: 2 })}>Proposed By</span>
                          <span style={s(styles.tableCell, { flex: 1 })}>Department</span>
                          <span style={s(styles.tableCell, { flex: 1 })}>Scale</span>
                          <span style={s(styles.tableCell, { flex: 1 })}>Category</span>
                          <span style={s(styles.tableCell, { flex: 1 })}>Budget</span>
                          <span style={s(styles.tableCell, { flex: 1 })}>Brochure</span>
                          <span style={s(styles.tableCell, { flex: 2, textAlign: 'right' })}>Actions</span>
                        </div>
                        {pendingEvents.map(ev => (
                          <div key={ev.id} style={styles.tableRow}>
                            <span style={s(styles.tableCell, { flex: 3, fontWeight: 'bold', color: theme.colors.maroon })}>
                              {ev.event_title}
                              {ev.immediate_approval && (
                                <span style={{ marginLeft: '8px', background: '#FFEBEE', color: '#C62828', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                  🚨 URGENT
                                </span>
                              )}
                              <span 
                                style={{ display: 'block', fontSize: '0.75rem', color: '#666', cursor: 'pointer', textDecoration: 'underline', marginTop: '4px', fontWeight: 'normal' }}
                                onClick={() => navigate(`/event-details/${ev.id}`)}
                              >
                                {ev.details?.is_festival ? 'View Timeline / Sub-Events 🔍' : 'View Timeline / Details 🔍'}
                              </span>
                            </span>
                            <span style={s(styles.tableCell, { flex: 2 })}>{ev.proposed_by}</span>
                            <span style={s(styles.tableCell, { flex: 1 })}>{ev.department}</span>
                            <span style={s(styles.tableCell, { flex: 1 })}>
                              <span style={styles.scaleChip}>{ev.event_scale}</span>
                            </span>
                            <span style={s(styles.tableCell, { flex: 1 })}>
                              <span style={styles.categoryChip}>{ev.category}</span>
                            </span>
                            <span style={s(styles.tableCell, { flex: 1 })}>
                              ₹{Number(ev.budget).toLocaleString('en-IN')}
                            </span>
                            <span style={s(styles.tableCell, { flex: 1 })}>
                              {ev.brochure_path ? (
                                <a href={`${API_BASE}/${ev.brochure_path}`} target="_blank" rel="noreferrer" style={{ color: theme.colors.maroon, textDecoration: 'underline' }}>View</a>
                              ) : 'N/A'}
                            </span>
                            <span style={s(styles.tableCell, { flex: 2, textAlign: 'right' })}>
                              <button
                                style={styles.approveBtn}
                                onClick={() => setRemarksModal({ open: true, eventId: ev.id, action: 'approve', scale: ev.event_scale })}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#CEEAD6'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#E6F4EA'; e.currentTarget.style.transform = 'translateY(0)'; }}
                              >
                                ✓ Approve
                              </button>
                              <button
                                style={styles.rejectBtn}
                                onClick={() => setRemarksModal({ open: true, eventId: ev.id, action: 'reject', scale: ev.event_scale })}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#FAD2CF'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#FCE8E6'; e.currentTarget.style.transform = 'translateY(0)'; }}
                              >
                                ✕ Reject
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
            </div>
          )}

          {/* My Proposals Content */}
          {activeNav === 'my-proposals' && (
            <div style={styles.contentCard}>
              <div style={styles.tabContainer}>
                <button 
                  style={s(styles.tabBtn, activeTab === 'proposalsList' ? styles.tabActive : styles.tabInactive)}
                  onClick={() => setActiveTab('proposalsList')}
                >
                  View Proposals
                </button>
                <button 
                  style={s(styles.tabBtn, activeTab === 'proposeNew' ? styles.tabActive : styles.tabInactive)}
                  onClick={() => setActiveTab('proposeNew')}
                >
                  Propose New Event
                </button>
              </div>

              <div style={{ paddingTop: '1.5rem' }}>
                {activeTab === 'proposalsList' && (
                  <div>
                    <h2 style={styles.sectionTitle}>My Proposals</h2>
              <p style={styles.sectionSub}>Track the status of events you have personally proposed.</p>
              {myEventsLoading ? (
                <p>Loading...</p>
              ) : myEvents.length === 0 ? (
                <div style={styles.emptyState}>
                  <span style={styles.emptyIcon}>📝</span>
                  <p style={styles.emptyText}>You haven't proposed any events yet.</p>
                </div>
              ) : (
                <div style={styles.grid}>
                  {myEvents.map(ev => (
                    <div key={ev.id} style={styles.eventCard}>
                      <h3 style={styles.eventTitle}>{ev.event_title}</h3>
                      <p style={styles.eventDetail}><strong>Category:</strong> {ev.category}</p>
                      <p style={styles.eventDetail}><strong>Budget:</strong> ₹{Number(ev.budget).toLocaleString('en-IN')}</p>
                      <div style={{marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                        <span style={{alignSelf: 'flex-start', ...styles.statusBadge(ev.current_status)}}>{ev.current_status}</span>
                        {['published', 'completed', 'pending_report'].includes(ev.current_status?.toLowerCase()) && (
                          <button
                            style={{ padding: '6px 12px', backgroundColor: theme.colors.maroon, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', alignSelf: 'flex-start' }}
                            onClick={() => {
                              setRosterEventId(ev.id);
                              setRosterModalOpen(true);
                            }}
                          >
                            View Roster
                          </button>
                        )}
                        {ev.current_status?.toLowerCase() === 'completed' && (
                          <button
                            style={{ padding: '6px 12px', backgroundColor: '#673AB7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', alignSelf: 'flex-start' }}
                            onClick={() => {
                              setFeedbackEventId(ev.id);
                              setFeedbackModalOpen(true);
                              fetchFeedbackData(ev.id);
                            }}
                          >
                            Insights / Feedback 📊
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
                  </div>
                )}
                
                {activeTab === 'proposeNew' && (
                  <div>
                    <h2 style={styles.sectionTitle}>Propose New Event</h2>
                    <p style={styles.sectionSub}>Complete the form below. Your request will be routed directly to the next level.</p>
                    {proposeMessage && (
                      <div style={proposeMessage.type === 'success' ? styles.successBox : styles.errorBox}>
                        {proposeMessage.text}
                      </div>
                    )}
                    <form onSubmit={handleProposeSubmit} style={styles.form}>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Event Title <span style={styles.required}>*</span></label>
                        <input style={styles.formInput} type="text" name="event_title" value={formData.event_title} onChange={handleProposeChange} required />
                      </div>
                      <div style={styles.formRow}>
                        <div style={{...styles.formGroup, flex: 1}}>
                          <label style={styles.formLabel}>Date <span style={styles.required}>*</span></label>
                          <input style={styles.formInput} type="date" name="date" value={formData.date} onChange={handleProposeChange} required />
                        </div>
                        <div style={{...styles.formGroup, flex: 1}}>
                          <label style={styles.formLabel}>Category <span style={styles.required}>*</span></label>
                          <select style={styles.formInput} name="category" value={formData.category} onChange={handleProposeChange} required>
                            <option value="">-- Select --</option>
                            <option value="Academic">Academic</option>
                            <option value="Cultural">Cultural</option>
                            <option value="Sports">Sports</option>
                          </select>
                        </div>
                        <div style={{...styles.formGroup, flex: 1}}>
                          <label style={styles.formLabel}>Event Scale <span style={styles.required}>*</span></label>
                          <select style={styles.formInput} name="event_scale" value={formData.event_scale} onChange={handleProposeChange} required>
                            <option value="">-- Select --</option>
                            <option value="department">Department</option>
                            <option value="university">University</option>
                          </select>
                        </div>
                        <div style={{...styles.formGroup, flex: 1}}>
                          <label style={styles.formLabel}>Budget (₹) <span style={styles.required}>*</span></label>
                          <input style={styles.formInput} type="number" name="budget" value={formData.budget} onChange={handleProposeChange} required />
                        </div>
                      </div>


                      
                      {/* Event Mode Toggle */}
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Event Mode <span style={styles.required}>*</span></label>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                          {['offline', 'online'].map(mode => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setFormData({ ...formData, event_mode: mode })}
                              style={{
                                padding: '0.5rem 1.5rem',
                                borderRadius: '20px',
                                border: `2px solid ${formData.event_mode === mode ? theme.colors.maroon : '#ddd'}`,
                                background: formData.event_mode === mode ? theme.colors.maroon : '#fff',
                                color: formData.event_mode === mode ? '#fff' : '#555',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              {mode === 'offline' ? '🏢 Offline' : '💻 Online'}
                            </button>
                          ))}
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.4rem' }}>
                          {formData.event_mode === 'offline'
                            ? 'Venue is required for offline events (set during logistics).'
                            : 'No venue needed — event will be held virtually.'}
                        </p>
                      </div>

                      {/* Participation Type — Solo / Group toggle */}
                      <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Participation Type <span style={styles.required}>*</span></label>
                          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                            {['solo', 'group'].map(ptype => (
                              <button
                                key={ptype}
                                type="button"
                                onClick={() => setFormData({ ...formData, participation_type: ptype })}
                                style={{
                                  padding: '0.5rem 1.5rem',
                                  borderRadius: '20px',
                                  border: `2px solid ${formData.participation_type === ptype ? theme.colors.maroon : '#ddd'}`,
                                  background: formData.participation_type === ptype ? theme.colors.maroon : '#fff',
                                  color: formData.participation_type === ptype ? '#fff' : '#555',
                                  fontWeight: 600,
                                  fontSize: '0.9rem',
                                  cursor: 'pointer',
                                  textTransform: 'capitalize',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                {ptype === 'solo' ? '👤 Solo' : '👥 Group'}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {formData.participation_type === 'group' && (
                          <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Max Team Size <span style={styles.required}>*</span></label>
                            <input
                              type="number"
                              min="2"
                              name="max_team_size"
                              value={formData.max_team_size}
                              onChange={handleProposeChange}
                              placeholder="e.g. 4"
                              style={styles.formInput}
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Rewards and Prizes</label>
                        <textarea
                          name="rewards"
                          value={formData.rewards}
                          onChange={handleProposeChange}
                          style={s(styles.formInput, { minHeight: '80px', resize: 'vertical' })}
                          placeholder="List any rewards, cash prizes, or certificates provided..."
                        />
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Brochure Document <span style={styles.required}>*</span></label>
                        <input
                          style={styles.formInput}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setFormData({...formData, brochureFile: e.target.files[0]})}
                          required
                        />
                        <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.4rem' }}>
                          Upload the official event brochure (PDF/JPG/PNG).
                        </p>
                      </div>

                      {/* Sub-Events Toggle */}
                      <div style={s(styles.formGroup, { marginTop: '1rem', padding: '1rem', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' })}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#333', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={formData.is_festival}
                            onChange={(e) => setFormData({...formData, is_festival: e.target.checked})}
                            disabled={proposeLoading}
                            style={{ width: '18px', height: '18px', accentColor: theme.colors.maroon }}
                          />
                          🎉 This is a Festival / Mega-Event (Has Sub-Events)
                        </label>
                        
                        {formData.is_festival && (
                          <div style={{ marginTop: '1rem' }}>
                            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>List the sub-events included in this festival:</p>
                            {formData.sub_events.map((sub, idx) => (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed #ccc' }}>
                                <input
                                  type="text"
                                  value={sub.name}
                                  placeholder="Sub-event name"
                                  onChange={(e) => {
                                    const newSubs = [...formData.sub_events];
                                    newSubs[idx].name = e.target.value;
                                    setFormData({...formData, sub_events: newSubs});
                                  }}
                                  style={s(styles.formInput, { flex: 1 })}
                                  required={formData.is_festival}
                                />
                                <textarea
                                  value={sub.description}
                                  placeholder="Sub-event description"
                                  onChange={(e) => {
                                    const newSubs = [...formData.sub_events];
                                    newSubs[idx].description = e.target.value;
                                    setFormData({...formData, sub_events: newSubs});
                                  }}
                                  style={s(styles.formInput, { flex: 1 })}
                                  rows="2"
                                  required={formData.is_festival}
                                />
                                {formData.sub_events.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newSubs = formData.sub_events.filter((_, i) => i !== idx);
                                      setFormData({...formData, sub_events: newSubs});
                                    }}
                                    style={{ alignSelf: 'flex-start', padding: '4px 8px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, sub_events: [...formData.sub_events, { name: '', description: '' }]})}
                              style={{ marginTop: '0.5rem', padding: '6px 12px', background: '#e0f7fa', color: '#006064', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                            >
                              + Add Another Sub-Event
                            </button>
                          </div>
                        )}
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Description <span style={styles.required}>*</span></label>
                        <textarea style={styles.formInput} name="description" value={formData.description} onChange={handleProposeChange} rows="4" required />
                      </div>

                      <div style={s(styles.formGroup, { marginTop: '1rem', padding: '1rem', background: '#fcfcfc', border: '1px solid #eee', borderRadius: '8px' })}>
                        <label style={s(styles.formLabel, { marginBottom: '0.8rem' })}>
                          Event Capacities <span style={styles.optional}>(optional)</span>
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>Max Participants</label>
                            <input
                              type="number"
                              min="1"
                              value={formData.max_participants}
                              onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
                              placeholder="e.g. 100"
                              style={s(styles.formInput, { padding: '8px' })}
                              disabled={proposeLoading}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>Max Volunteers</label>
                            <input
                              type="number"
                              min="0"
                              value={formData.max_volunteers}
                              onChange={(e) => setFormData({...formData, max_volunteers: e.target.value})}
                              placeholder="e.g. 10"
                              style={s(styles.formInput, { padding: '8px' })}
                              disabled={proposeLoading}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>Max Coordinators</label>
                            <input
                              type="number"
                              min="0"
                              value={formData.max_coordinators}
                              onChange={(e) => setFormData({...formData, max_coordinators: e.target.value})}
                              placeholder="e.g. 2"
                              style={s(styles.formInput, { padding: '8px' })}
                              disabled={proposeLoading}
                            />
                          </div>
                        </div>
                      </div>

                      <div style={s(styles.formGroup, { marginTop: '1rem' })}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#555', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={formData.immediate_approval}
                            onChange={(e) => setFormData({...formData, immediate_approval: e.target.checked})}
                            disabled={proposeLoading}
                            style={{ width: '18px', height: '18px', accentColor: theme.colors.maroon }}
                          />
                          🚨 Needs Immediate Approval (Urgent)
                        </label>
                        <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.4rem', marginLeft: '1.8rem' }}>
                          Check this only if the event requires urgent attention (e.g. Independence Day).
                        </p>
                      </div>

                      <div style={styles.submitRow}>
                        <button type="submit" style={styles.submitBtn} disabled={proposeLoading}>
                          {proposeLoading ? 'Submitting...' : '🚀 Submit Proposal'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Events Modal */}
          {subEventsModal.open && (
            <div style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                background: '#fff', borderRadius: '12px', padding: '2rem', width: '90%', maxWidth: '450px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)', position: 'relative'
              }}>
                <h3 style={{ marginTop: 0, color: theme.colors.maroon }}>{subEventsModal.eventTitle} - Sub-Events</h3>
                <ul style={{ paddingLeft: '20px', margin: '1rem 0' }}>
                  {subEventsModal.subEvents.map((sub, i) => (
                    <li key={i} style={{ marginBottom: '8px', fontSize: '0.95rem' }}>{sub}</li>
                  ))}
                  {subEventsModal.subEvents.length === 0 && (
                    <li style={{ color: '#888' }}>No sub-events listed.</li>
                  )}
                </ul>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button 
                    onClick={() => setSubEventsModal({ open: false, eventTitle: '', subEvents: [] })}
                    style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Approved History Content */}
          {activeNav === 'approved-history' && (
            <div style={styles.contentCard}>
              <h2 style={styles.sectionTitle}>Events Approved by Me</h2>
              <p style={styles.sectionSub}>Historical log of all events you have approved in the pipeline.</p>
              {approvedLoading ? (
                <p>Loading...</p>
              ) : approvedEvents.length === 0 ? (
                <div style={styles.emptyState}>
                  <span style={styles.emptyIcon}>✅</span>
                  <p style={styles.emptyText}>No approved events found.</p>
                </div>
              ) : (
                <div style={styles.grid}>
                  {approvedEvents.map(ev => (
                    <div key={ev.id} style={styles.eventCard}>
                      <h3 style={styles.eventTitle}>{ev.event_title}</h3>
                      <p style={styles.eventDetail}><strong>Proposed By:</strong> {ev.proposed_by}</p>
                      <p style={styles.eventDetail}><strong>Department:</strong> {ev.department}</p>
                      <p style={styles.eventDetail}><strong>Scale:</strong> <span style={styles.scaleChip}>{ev.event_scale}</span></p>
                      <p style={styles.eventDetail}><strong>Category:</strong> {ev.category}</p>
                      <p style={styles.eventDetail}><strong>Budget:</strong> ₹{Number(ev.budget).toLocaleString('en-IN')}</p>
                      <div style={{marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                        <span style={{alignSelf: 'flex-start', ...styles.statusBadge(ev.current_status)}}>{ev.current_status}</span>
                        <button
                          style={{ padding: '6px 12px', backgroundColor: '#e0e0e0', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', alignSelf: 'flex-start' }}
                          onClick={() => navigate(`/event-details/${ev.id}`)}
                        >
                          Track Timeline 🔍
                        </button>
                        {['published', 'completed', 'pending_report'].includes(ev.current_status?.toLowerCase()) && (
                          <button
                            style={{ padding: '6px 12px', backgroundColor: theme.colors.maroon, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', alignSelf: 'flex-start' }}
                            onClick={() => {
                              setRosterEventId(ev.id);
                              setRosterModalOpen(true);
                            }}
                          >
                            View Roster
                          </button>
                        )}
                        {ev.current_status?.toLowerCase() === 'completed' && (
                          <button
                            style={{ padding: '6px 12px', backgroundColor: '#673AB7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', alignSelf: 'flex-start' }}
                            onClick={() => {
                              setFeedbackEventId(ev.id);
                              setFeedbackModalOpen(true);
                              fetchFeedbackData(ev.id);
                            }}
                          >
                            Insights / Feedback 📊
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeNav === 'calendar' && (
            <div style={styles.contentCard}>
              <h2 style={styles.sectionTitle}>Event Calendar</h2>
              <p style={styles.sectionSub}>View your proposed and upcoming events.</p>
              <EventCalendar events={myEvents} />
            </div>
          )}

          {activeNav === 'reports' && (
            <ReportsView user={user} />
          )}

          {activeNav === 'archive' && (
            <EventArchive user={user} />
          )}

          {activeNav === 'notifications' && (
            <NotificationView />
          )}
        </div>
      </main>

      {/* ── Attendee Roster Modal ──────────────────────────────── */}
      {rosterModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(10,5,5,0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: '800px',
            borderRadius: '12px', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem', background: '#FAFAFA',
              borderBottom: '1px solid #E5E7EB', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: theme.colors.maroon }}>
                Attendee Roster
              </h3>
              <button 
                onClick={() => setRosterModalOpen(false)}
                style={{
                  background: 'none', border: 'none', fontSize: '1.25rem',
                  cursor: 'pointer', color: '#666'
                }}
              >×</button>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              <AttendeeRoster eventId={rosterEventId} />
            </div>
          </div>
        </div>
      )}

      {/* ── Remarks Modal ──────────────────────────────── */}
      {remarksModal.open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%', maxWidth: '400px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}>
            <div style={{
              background: remarksModal.action === 'approve' ? 'linear-gradient(135deg, #137333 0%, #0d5c25 100%)' : 'linear-gradient(135deg, #C5221F 0%, #a11a17 100%)',
              padding: '1.25rem 1.5rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              color: '#fff',
              borderBottom: '1px solid rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {remarksModal.action === 'approve' ? '✓ Approve Event' : '✕ Reject Event'}
              </h3>
              <button
                onClick={() => setRemarksModal({ open: false, eventId: null, action: null, scale: null })}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
              >✕</button>
            </div>
            <form onSubmit={submitActionWithRemarks} style={{ padding: '1.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#333', fontSize: '0.95rem' }}>
                Remarks / Reason {remarksModal.action === 'reject' && <span style={{color: '#C5221F'}}>*</span>}
              </label>
              <textarea
                value={remarksText}
                onChange={(e) => setRemarksText(e.target.value)}
                placeholder={remarksModal.action === 'approve' ? "Optional: Add any notes or minor conditions..." : "Required: Why is this being rejected?"}
                rows="4"
                style={{ width: '100%', padding: '0.85rem', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', background: '#FAFAFA', fontFamily: 'inherit', transition: '0.2s' }}
                onFocus={(e) => e.target.style.borderColor = remarksModal.action === 'approve' ? '#137333' : '#C5221F'}
                onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.75rem', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRemarksModal({ open: false, eventId: null, action: null, scale: null })}
                  style={{ padding: '0.65rem 1.25rem', border: '1px solid #D1D5DB', background: '#fff', color: '#4B5563', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: '0.2s' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.65rem 1.25rem', border: 'none', background: remarksModal.action === 'approve' ? '#137333' : '#C5221F', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: '0.2s' }}
                >
                  Confirm {remarksModal.action === 'approve' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Feedback Insights Modal ──────────────────────────────── */}
      {feedbackModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(10,5,5,0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%', maxWidth: '600px',
            maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 60px rgba(74,4,4,0.22)',
            overflow: 'hidden',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #673AB7 0%, #512DA8 100%)',
              padding: '1.5rem 1.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontWeight: 700 }}>📊 Event Insights & Feedback</h2>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem' }}>Student ratings and comments</p>
              </div>
              <button
                onClick={() => setFeedbackModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                  width: '32px', height: '32px', color: '#fff', fontSize: '1.2rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              {feedbackLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading insights...</div>
              ) : !feedbackData ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Could not load feedback.</div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ flex: 1, background: '#F5F5F5', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#673AB7' }}>{feedbackData.average_rating}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Rating</div>
                    </div>
                    <div style={{ flex: 1, background: '#F5F5F5', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#673AB7' }}>{feedbackData.total_feedback}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Responses</div>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1rem', color: '#333', marginBottom: '1rem', borderBottom: '2px solid #EEE', paddingBottom: '0.5rem' }}>Student Comments</h3>
                  
                  {feedbackData.comments.length === 0 ? (
                    <p style={{ color: '#888', fontStyle: 'italic' }}>No comments submitted yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {feedbackData.comments.map((fb, idx) => (
                        <div key={idx} style={{ padding: '1rem', background: '#FAFAFA', borderRadius: '8px', border: '1px solid #EEE' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <strong style={{ color: '#444' }}>{fb.student_name}</strong>
                            <span style={{ color: '#FBC02D' }}>{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</span>
                          </div>
                          {fb.comments && <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#555' }}>{fb.comments}</p>}
                          <small style={{ color: '#999', fontSize: '0.75rem' }}>{new Date(fb.created_at).toLocaleDateString()}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles (Matching FacultyDashboard) ────────────────────────────────────────────────────────
const styles = {
  root: { display: 'flex', minHeight: '100vh', background: theme.colors.offWhite || '#FAF8F5', fontFamily: theme.fonts.sansSerif },
  
  // Sidebar
  sidebar: { width: '240px', minHeight: '100vh', background: theme.gradients.header, display: 'flex', flexDirection: 'column', padding: '1.5rem 0', transition: 'width 0.25s ease', flexShrink: 0, position: 'sticky', top: 0, overflowX: 'hidden' },
  sidebarCollapsed: { width: '64px' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 1.25rem 1rem', whiteSpace: 'nowrap', overflow: 'hidden' },
  sidebarCrest: { fontSize: '1.8rem', color: theme.colors.gold, flexShrink: 0 },
  sidebarLogoName: { fontFamily: theme.fonts.serif, fontSize: '0.95rem', fontWeight: 'bold', color: theme.colors.gold, lineHeight: 1.1 },
  sidebarLogoSub: { fontSize: '0.6rem', color: 'rgba(253,208,111,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase' },
  divider: { height: '1px', background: 'rgba(253,208,111,0.15)', margin: '0 1.25rem 1rem' },
  
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0 0.75rem' },
  navItem: { display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.65rem 0.75rem', borderRadius: '6px', cursor: 'pointer', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.65)', transition: '0.2s', whiteSpace: 'nowrap', overflow: 'hidden', fontSize: '0.9rem' },
  navItemActive: { background: 'rgba(253,208,111,0.15)', color: theme.colors.gold, fontWeight: 'bold' },
  navIcon: { fontSize: '1.1rem', flexShrink: 0, width: '22px', textAlign: 'center' },
  navLabel: { fontSize: '0.875rem' },
  
  sidebarUserCard: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderTop: '1px solid rgba(253,208,111,0.15)', overflow: 'hidden' },
  userAvatar: { width: '36px', height: '36px', borderRadius: '50%', background: theme.colors.gold, color: theme.colors.maroon, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0 },
  userInfo: { overflow: 'hidden' },
  userName: { fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: '0.68rem', color: 'rgba(253,208,111,0.7)', textTransform: 'capitalize' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.5rem 0.75rem 0', padding: '0.65rem 0.75rem', background: 'transparent', border: 'none', borderRadius: '6px', color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', cursor: 'pointer', transition: '0.2s', overflow: 'hidden', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  
  // Main
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  
  // Top bar
  topBar: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 2rem', background: '#ffffff', borderBottom: '1px solid #ede9e3', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'sticky', top: 0, zIndex: 100 },
  collapseBtn: { background: 'transparent', border: '1px solid #ddd', borderRadius: '6px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.maroon, flexShrink: 0 },
  topBarCenter: { flex: 1 },
  topBarTitle: { fontFamily: theme.fonts.serif, fontSize: '1.2rem', fontWeight: 'bold', color: '#333', lineHeight: 1.1 },
  topBarSub: { fontSize: '0.75rem', color: '#666' },
  topBarUser: { display: 'flex', alignItems: 'center', gap: '0.65rem' },
  topBarAvatar: { width: '38px', height: '38px', borderRadius: '50%', background: theme.colors.maroon, color: theme.colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.95rem', flexShrink: 0 },
  topBarUserInfo: {},
  topBarUserName: { fontSize: '0.85rem', fontWeight: 'bold', color: '#333' },
  topBarUserRole: { fontSize: '0.72rem', color: '#666' },
  
  // Content
  content: { padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' },
  contentCard: { background: '#ffffff', borderRadius: '12px', padding: '1.75rem 2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #ede9e3' },
  sectionTitle: { fontFamily: theme.fonts.serif, fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '0.3rem' },
  sectionSub: { fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem' },
  
  // Tabs
  tabContainer: { display: 'flex', gap: '0.5rem', borderBottom: '1px solid #ede9e3', marginBottom: '1rem' },
  tabBtn: { background: 'transparent', border: 'none', borderBottom: '3px solid transparent', padding: '0.75rem 1.5rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '-1px', color: '#666', transition: '0.2s' },
  tabActive: { color: theme.colors.maroon, borderBottomColor: theme.colors.maroon },
  
  // Forms
  form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  formRow: { display: 'flex', gap: '1.25rem', flexWrap: 'wrap' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '200px' },
  formLabel: { fontSize: '0.8rem', fontWeight: 'bold', color: '#444' },
  required: { color: '#C62828' },
  optional: { color: '#888', fontWeight: 'normal' },
  formInput: { border: `1px solid #ddd`, borderRadius: '6px', padding: '0.7rem 0.9rem', fontSize: '0.9rem', color: '#333', outline: 'none', background: '#FAFAFA', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
  
  submitRow: { display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #f0ede8' },
  submitBtn: { background: theme.gradients.header, color: theme.colors.gold, border: 'none', borderRadius: '24px', padding: '0.75rem 2rem', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  
  // Tables & Lists
  tableWrap: { overflowX: 'auto' },
  tableRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderBottom: '1px solid #f0ede8', minWidth: '700px' },
  tableHeader: { background: '#FAF8F5', borderRadius: '6px 6px 0 0', fontWeight: 'bold', fontSize: '0.75rem', color: '#666', textTransform: 'uppercase' },
  tableCell: { fontSize: '0.875rem', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  categoryChip: { background: theme.colors.goldLight, color: '#7a4a00', borderRadius: '12px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 'bold' },
  scaleChip: { background: '#E0E7FF', color: '#3730A3', borderRadius: '12px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'capitalize' },
  approveBtn: { background: '#E6F4EA', color: '#137333', border: '1px solid #A5D6A7', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginRight: '0.5rem', fontSize: '0.75rem' },
  rejectBtn: { background: '#FCE8E6', color: '#C5221F', border: '1px solid #F8BBD0', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' },
  
  // Empty states
  emptyState: { textAlign: 'center', padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' },
  emptyIcon: { fontSize: '2.5rem', opacity: 0.5 },
  emptyText: { fontSize: '0.9rem', color: '#666' },
  errorBox: { background: '#FFEBEE', color: '#B71C1C', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid #EF9A9A' },
  successBox: { background: '#E8F5E9', color: '#1B5E20', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid #A5D6A7' },
  
  // Grid
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' },
  eventCard: { padding: '1.5rem', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '8px' },
  eventTitle: { margin: '0 0 1rem', fontSize: '1.1rem', color: theme.colors.maroon },
  eventDetail: { margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#444' },
  
  statusBadge: (status) => {
    let bg = '#E5E7EB'; let color = '#374151';
    if (status?.includes('approved')) { bg = '#E6F4EA'; color = '#137333'; }
    else if (status?.includes('pending')) { bg = '#FFF8E1'; color = '#C17F24'; }
    else if (status?.includes('rejected')) { bg = '#FCE8E6'; color = '#C5221F'; }
    return { background: bg, color: color, padding: '0.3rem 0.75rem', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' };
  }
};
