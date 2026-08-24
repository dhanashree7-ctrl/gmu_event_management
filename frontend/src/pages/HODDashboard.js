import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import theme from '../theme';
import AttendeeRoster from './AttendeeRoster';
import EventArchive from '../components/EventArchive';
import ReportsView from '../components/ReportsView';
import NotificationView from '../components/NotificationView';
import EventCalendar from '../components/EventCalendar';
import DashboardMetrics from '../components/DashboardMetrics';
import SettingsView from '../components/SettingsView';
import { Clock, CheckCircle, CheckSquare, FileText, X } from 'lucide-react';
export default function HODDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Navigation state
  const [activeNav, setActiveNav] = useState('Dashboard'); // dashboard, action-center, propose-event, my-proposals, approved-history
  const [collapsed, setCollapsed] = useState(false);
  
  // Tab state within Action Center
  const [activeTab, setActiveTab] = useState('review'); // review, propose
  const [showProposeForm, setShowProposeForm] = useState(false);
  
  // Action Center: Review Queue
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Action Center: Propose Event
  const [formData, setFormData] = useState({
    event_title: '', date: '', coordinator_name: '', coordinator_name: '', start_time: '', end_time: '', venue: '', description: '', category: '', event_scale: '',
    event_mode: 'offline',
    budget: '',
    rewards: '',
    immediate_approval: false,
    brochureFile: null,
    approval_route: [],
    max_participants: '',
    max_volunteers: '',
    is_festival: false,
    sub_events: [{ name: '', description: '', participation_type: 'solo', max_participants: '', coordinator_name: '' }],
    participation_type: 'solo',
    max_team_size: '',
    sub_events: [{ name: '', description: '', participation_type: 'solo', max_participants: '', coordinator_name: '' }]
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
      if (parsedUser.role !== 'hod') {
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
      const url = `${API_BASE}/get_archived_events.php?role=${user.role}&department=${encodeURIComponent(user.department_name || '')}`;
      const res = await fetch(url);
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
        body: JSON.stringify({ role: user.role, department_name: user.department_name })
      });
      const json = await res.json();
      if (json.success) {
        setPendingEvents(json.data || []);
      } else {
        setError(json.message || 'Failed to load pending events.');
      }
    } catch (err) {
      setError('Cannot reach server.');
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
  const [remarksModal, setRemarksModal] = useState({ open: false, eventId: null, action: null, scale: null, proposer_role: null });
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
      const res = await fetch(`${API_BASE}/get_hod_approved_events.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department_name: user.department_name })
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
    const { eventId, action, scale, proposer_role } = remarksModal;
    
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
          department_name: user.department_name,
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
      setRemarksModal({ open: false, eventId: null, action: null, scale: null, proposer_role: null });
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
      fd.append('coordinator_name', formData.coordinator_name);
      if (formData.coordinator_name) formData.append('coordinator_name', formData.coordinator_name);
      fd.append('start_time', formData.start_time);
      fd.append('end_time', formData.end_time);
      fd.append('venue', formData.venue);
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
        fd.append('sub_events', JSON.stringify(formData.sub_events.filter(s => s.name && s.name.trim() !== '')));
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
        setFormData({ event_title: '', date: '', coordinator_name: '', coordinator_name: '', start_time: '', end_time: '', venue: '', description: '', category: '', event_scale: '', event_mode: 'offline', budget: '',
    rewards: '', brochureFile: null, approval_route: [], max_participants: '', max_volunteers: '', max_coordinators: '', is_festival: false, sub_events: [{ name: '', description: '', participation_type: 'solo', max_participants: '', coordinator_name: '' }], participation_type: 'solo', max_team_size: '' });
      } else {
        setProposeMessage({ type: 'error', text: json.message || 'Failed to propose event.' });
      }
    } catch (err) {
      setProposeMessage({ type: 'error', text: 'Cannot reach server.' });
    } finally {
      setProposeLoading(false);
    }
  };

  // Utility to combine styles
  const s = (...args) => Object.assign({}, ...args.filter(Boolean));

  if (!user) return null;

  return (
    <DashboardLayout role="hod" activeNav={activeNav} onNavChange={setActiveNav}>
      <>
          
          {/* Dashboard View */}
          {activeNav === 'Dashboard' && (
            <>
              <div style={{
                background: theme.gradients.header,
                borderRadius: theme.radii.xl,
                padding: '2rem 1.5rem',
                minHeight: '120px',
                color: '#fff',
                marginBottom: '2rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ zIndex: 1 }}>
                  <h2 style={{ fontFamily: theme.fonts.serif, margin: '0 0 0.5rem', fontSize: 'clamp(1.2rem, 2vw, 1.8rem)', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)', lineHeight: '1.4' }}>
                    Good {getGreeting()}, {user?.name?.split(' ')[0]} 
                  </h2>
                  <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
                    Manage department approvals and review event metrics.
                  </p>
                </div>
                <div style={{
                  position: 'absolute', right: '-20px', top: '-20px', fontSize: '120px', opacity: 0.1, transform: 'rotate(15deg)'
                }}>
                  🏛️
                </div>
              </div>

              <div style={styles.statsRow}>
                <div style={styles.statCard}>
                  <div style={{...styles.statIcon, background: '#C17F2418', color: '#C17F24'}}>
                    <Clock size={24} color="#C17F24" />
                  </div>
                  <div>
                    <p style={styles.statValue}>{pendingEvents.length}</p>
                    <p style={styles.statLabel}>Pending Reviews</p>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={{...styles.statIcon, background: '#2E7D3218', color: '#2E7D32'}}>
                    <CheckCircle size={24} color="#2E7D32" />
                  </div>
                  <div>
                    <p style={styles.statValue}>{approvedEvents.length}</p>
                    <p style={styles.statLabel}>My Approvals</p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ background: '#fff', borderRadius: theme.radii.xl, padding: '1.25rem 1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: '1px solid #f0ebe1' }}>
                  <h3 style={{ fontSize: '0.95rem', color: theme.colors.maroon, fontWeight: 700, marginBottom: '0.75rem', marginTop: 0 }}>Event Status Overview</h3>
                  <DashboardMetrics 
                    data={[
                      { name: 'Pending Approvals', count: pendingEvents.length },
                      { name: 'Approved Events', count: approvedEvents.length },
                      { name: 'My Proposals', count: myEvents.length }
                    ]} 
                    type="overview" 
                    barName="Total Items"
                  />
                </div>
                {systemEvents.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: theme.radii.xl, padding: '1.25rem 1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: '1px solid #f0ebe1' }}>
                    <h3 style={{ fontSize: '0.95rem', color: theme.colors.maroon, fontWeight: 700, marginBottom: '0.75rem', marginTop: 0 }}>Department Event Distribution</h3>
                    <DashboardMetrics data={categoryData} type="category" barName="Total Events" chartType="pie" />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Center Content */}
          {activeNav === 'Action Center' && (
            <div style={styles.contentCard}>
              <div>
                    <h2 style={styles.sectionTitle}>Pending Approvals ({user.department_name})</h2>
                    <p style={styles.sectionSub}>Review event requests from your department faculty.</p>
                    {error && <div style={styles.errorBox}>{error}</div>}
                    {loading ? (
                      <p>Loading events...</p>
                    ) : pendingEvents.length === 0 ? (
                      <div style={styles.emptyState}>
                        <span style={styles.emptyIcon}></span>
                        <p style={styles.emptyText}>All caught up! No events pending your approval.</p>
                      </div>
                    ) : (
                      <div style={styles.tableWrap}>
                        <div style={s(styles.tableRow, styles.tableHeader)}>
                          <span style={s(styles.tableCell, { flex: 3 })}>Event Title</span>
                          <span style={s(styles.tableCell, { flex: 2 })}>Proposed By</span>
                          <span style={s(styles.tableCell, { flex: 1 })}>Scale</span>
                          <span style={s(styles.tableCell, { flex: 1 })}>Category</span>
                          <span style={s(styles.tableCell, { flex: 1 })}>Budget</span>
                          <span style={s(styles.tableCell, { flex: 1 })}>Brochure</span>
                          <span style={s(styles.tableCell, { flex: '0 0 190px', minWidth: '190px', textAlign: 'right', overflow: 'visible' })}>Actions</span>
                        </div>
                        {pendingEvents.map(ev => (
                          <div key={ev.id} style={styles.tableRow}>
                            <span style={s(styles.tableCell, { flex: 3, fontWeight: 'bold', color: theme.colors.maroon })}>
                              {ev.event_title}
                              {ev.immediate_approval && (
                                <span style={{ marginLeft: '8px', background: '#FFEBEE', color: '#C62828', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                   URGENT
                                </span>
                              )}
                              <span 
                                style={{ display: 'block', fontSize: '0.75rem', color: '#666', cursor: 'pointer', textDecoration: 'underline', marginTop: '4px', fontWeight: 'normal' }}
                                onClick={() => navigate(`/event-details/${ev.id}`)}
                              >
                                {ev.details?.is_festival ? 'View Timeline / Sub-Events ' : 'View Timeline / Details '}
                              </span>
                            </span>
                            <span style={s(styles.tableCell, { flex: 2 })}>{ev.proposed_by}</span>
                            <span style={s(styles.tableCell, { flex: 1 })}>
                              <span style={styles.scaleChip}>{ev.event_scale}</span>
                            </span>
                            <span style={s(styles.tableCell, { flex: 1 })}>
                              <span style={styles.categoryChip}>{ev.category}</span>
                            </span>
                            <span style={s(styles.tableCell, { flex: 1 })}>
                              {Number(ev.budget).toLocaleString('en-IN')}
                            </span>
                            <span style={s(styles.tableCell, { flex: 1 })}>
                              {(ev.brochure_file_path || ev.brochure_path) ? (
                                <a href={`${API_BASE}/${ev.brochure_file_path || ev.brochure_path}`} target="_blank" rel="noreferrer" style={{ color: theme.colors.maroon, textDecoration: 'underline' }}>View</a>
                              ) : 'N/A'}
                            </span>
                            <span style={s(styles.tableCell, { flex: '0 0 190px', minWidth: '190px', textAlign: 'right', overflow: 'visible', display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' })}>
                              <button
                                style={styles.approveBtn}
                                onClick={() => setRemarksModal({ open: true, eventId: ev.id, action: 'approve', scale: ev.event_scale, proposer_role: ev.initiator_role })}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#CEEAD6'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#E6F4EA'; e.currentTarget.style.transform = 'translateY(0)'; }}
                              >
                                 Approve
                              </button>
                              <button
                                style={styles.rejectBtn}
                                onClick={() => setRemarksModal({ open: true, eventId: ev.id, action: 'reject', scale: ev.event_scale, proposer_role: ev.initiator_role })}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#FAD2CF'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#FCE8E6'; e.currentTarget.style.transform = 'translateY(0)'; }}
                              >
                                 Reject
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
            </div>
          )}

          {/* Propose Event Content */}
          {activeNav === 'Events' && showProposeForm && (
            <div style={styles.contentCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h2 style={styles.sectionTitle}>Propose New Event</h2>
                  <p style={styles.sectionSub}>Complete the form below. Your request will be routed directly to the Director.</p>
                </div>
                <button
                  onClick={() => setShowProposeForm(false)}
                  style={{ padding: '0.6rem 1.2rem', backgroundColor: '#e0e0e0', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                   Back to List
                </button>
              </div>
              <div>
                    {proposeMessage && (
                      <div style={proposeMessage.type === 'success' ? styles.successBox : styles.errorBox}>
                        {proposeMessage.text}
                      </div>
                    )}
                    <form onSubmit={handleProposeSubmit} style={styles.form}>
                      <div style={styles.formRow}>
                        <div style={{...styles.formGroup, flex: 2}}>
                          <label style={styles.formLabel}>Event Title <span style={styles.required}>*</span></label>
                          <input style={styles.formInput} type="text" name="event_title" value={formData.event_title} onChange={handleProposeChange} required />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Event Date <span style={{color:'red'}}>*</span></label>
                          <input style={styles.formInput} type="date" name="date" value={formData.date} onChange={handleProposeChange} required />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Start Time <span style={{color:'red'}}>*</span></label>
                          <input style={styles.formInput} type="time" name="start_time" value={formData.start_time || ''} onChange={handleProposeChange} required />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>End Time <span style={{color:'red'}}>*</span></label>
                          <input style={styles.formInput} type="time" name="end_time" value={formData.end_time || ''} onChange={handleProposeChange} required />
                        </div>
                         
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Main Coordinator Name</label>
                          <input style={styles.formInput} type="text" name="coordinator_name" placeholder="e.g. Dr. Smith" value={formData.coordinator_name || ''} onChange={handleProposeChange} />
                        </div>
<div style={styles.formGroup}>
                          <label style={styles.formLabel}>Venue <span style={{color:'red'}}>*</span></label>
                          <input style={styles.formInput} type="text" name="venue" placeholder="e.g. Main Auditorium" value={formData.venue || ''} onChange={handleProposeChange} required />
                        </div>
                      </div>
                      <div style={styles.formRow}>
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
                          <label style={styles.formLabel}>Budget () <span style={styles.required}>*</span></label>
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
                              {mode === 'offline' ? ' Offline' : ' Online'}
                            </button>
                          ))}
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.4rem' }}>
                          {formData.event_mode === 'offline'
                            ? 'Venue is required for offline events (set during logistics).'
                            : 'No venue needed  event will be held virtually.'}
                        </p>
                      </div>
                                      {/* Participation Type  Solo / Group toggle */}
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
                                {ptype === 'solo' ? ' Solo' : ' Group'}
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
                           This is a Festival / Mega-Event (Has Sub-Events)
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
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <select
                              value={sub.participation_type || 'solo'}
                              onChange={(e) => {
                                const newSubs = [...formData.sub_events];
                                newSubs[idx].participation_type = e.target.value;
                                setFormData({formData, sub_events: newSubs});
                              }}
                              style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                            >
                              <option value="solo">Solo</option>
                              <option value="group">Group</option>
                            </select>
                            {sub.participation_type === 'group' ? (
                              <>
                                <input
                                  type="number"
                                  value={sub.max_groups || ''}
                                  onChange={(e) => {
                                    const newSubs = [...formData.sub_events];
                                    newSubs[idx].max_groups = e.target.value;
                                    setFormData({formData, sub_events: newSubs});
                                  }}
                                  placeholder="Max Groups"
                                  style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                                />
                                <input
                                  type="number"
                                  value={sub.max_team_size || ''}
                                  onChange={(e) => {
                                    const newSubs = [...formData.sub_events];
                                    newSubs[idx].max_team_size = e.target.value;
                                    setFormData({formData, sub_events: newSubs});
                                  }}
                                  placeholder="Max per Group"
                                  style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                                />
                              </>
                            ) : (
                              <input
                                type="number"
                                value={sub.max_participants || ''}
                                onChange={(e) => {
                                  const newSubs = [...formData.sub_events];
                                  newSubs[idx].max_participants = e.target.value;
                                  setFormData({formData, sub_events: newSubs});
                                }}
                                placeholder="Max Participants"
                                style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                              />
                            )}
                            <input
                              type="text"
                              value={sub.coordinator_name || ''}
                              onChange={(e) => {
                                const newSubs = [...formData.sub_events];
                                newSubs[idx].coordinator_name = e.target.value;
                                setFormData({formData, sub_events: newSubs});
                              }}
                              placeholder="Coordinator Name"
                              style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                            />
                            <input
                              type="text"
                              value={sub.venue || ''}
                              onChange={(e) => {
                                const newSubs = [...formData.sub_events];
                                newSubs[idx].venue = e.target.value;
                                setFormData({formData, sub_events: newSubs});
                              }}
                              placeholder="Sub-Event Venue"
                              style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', color: '#666', whiteSpace: 'nowrap' }}>Start Time:</label>
                                <input
                                  type="time"
                                  value={sub.start_time || ''}
                                  onChange={(e) => {
                                    const newSubs = [...formData.sub_events];
                                    newSubs[idx].start_time = e.target.value;
                                    setFormData({formData, sub_events: newSubs});
                                  }}
                                  style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                                />
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', color: '#666', whiteSpace: 'nowrap' }}>End Time:</label>
                                <input
                                  type="time"
                                  value={sub.end_time || ''}
                                  onChange={(e) => {
                                    const newSubs = [...formData.sub_events];
                                    newSubs[idx].end_time = e.target.value;
                                    setFormData({formData, sub_events: newSubs});
                                  }}
                                  style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                                />
                            </div>
                          </div>
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
                              onClick={() => setFormData({...formData, sub_events: [...formData.sub_events, { name: '', description: '', participation_type: 'solo', max_participants: '', coordinator_name: '' }]})}
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
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
                           Needs Immediate Approval (Urgent)
                        </label>
                        <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.4rem', marginLeft: '1.8rem' }}>
                          Check this only if the event requires urgent attention (e.g. Independence Day).
                        </p>
                      </div>

                      <div style={styles.submitRow}>
                        <button type="submit" style={styles.submitBtn} disabled={proposeLoading}>
                          {proposeLoading ? 'Submitting...' : ' Submit Proposal'}
                        </button>
                      </div>
                    </form>
                  </div>
            </div>
          )}

          {/* My Proposals Content */}
          {activeNav === 'Events' && !showProposeForm && (
            <div style={styles.contentCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h2 style={styles.sectionTitle}>My Proposals</h2>
                  <p style={styles.sectionSub}>Track the status of events you have personally proposed.</p>
                </div>
                <button
                  onClick={() => setShowProposeForm(true)}
                  style={{ padding: '0.6rem 1.2rem', backgroundColor: theme.colors.maroon, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  + New Proposal
                </button>
              </div>
              {myEventsLoading ? (
                <p>Loading...</p>
              ) : myEvents.length === 0 ? (
                <div style={styles.emptyState}>
                  <span style={styles.emptyIcon}></span>
                  <p style={styles.emptyText}>You haven't proposed any events yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #eaeaea' }}>
                  {/* Table header */}
                  <div style={{ ...styles.tableRow, ...styles.tableHeader, borderBottom: '1px solid #eaeaea' }}>
                    <span style={{ ...styles.tableCell, flex: 3 }}>Event Title</span>
                    <span style={{ ...styles.tableCell, flex: 1 }}>Scale</span>
                    <span style={{ ...styles.tableCell, flex: 1 }}>Category</span>
                    <span style={{ ...styles.tableCell, flex: 1 }}>Budget</span>
                    <span style={{ ...styles.tableCell, flex: 1 }}>Status</span>
                  </div>
                  {myEvents.map((ev) => (
                    <div key={ev.id} style={styles.tableRow}>
                      <span style={{ ...styles.tableCell, flex: 3, fontWeight: 500, whiteSpace: 'normal', paddingRight: '1rem' }}>
                        {ev.event_title}
                      </span>
                      <span style={{ ...styles.tableCell, flex: 1 }}>
                        <span style={styles.scaleChip}>{ev.event_scale || 'N/A'}</span>
                      </span>
                      <span style={{ ...styles.tableCell, flex: 1 }}>
                        <span style={styles.categoryChip}>{ev.category}</span>
                      </span>
                      <span style={{ ...styles.tableCell, flex: 1 }}>
                        ₹{Number(ev.budget).toLocaleString('en-IN')}
                      </span>
                      <span style={{ ...styles.tableCell, flex: 1 }}>
                        <span style={{ ...styles.statusBadge(ev.current_status), display: 'inline-block', marginBottom: '8px' }}>{ev.current_status}</span>
                        {ev.brochure_path && (
                          <button
                            style={{ display: 'block', padding: '5px 10px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', width: '100%', marginBottom: '6px' }}
                            onClick={() => window.open(`${API_BASE}/${ev.brochure_path.startsWith('uploads/') ? ev.brochure_path : `uploads/${ev.brochure_path}`}`, '_blank')}
                          >
                            Brochure
                          </button>
                        )}
                        {['published', 'completed', 'pending_report'].includes(ev.current_status?.toLowerCase()) && (
                          <button
                            style={{ display: 'block', padding: '5px 10px', backgroundColor: theme.colors.maroon, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', width: '100%', marginBottom: '6px' }}
                            onClick={() => {
                              setRosterEventId(ev.id);
                              setRosterModalOpen(true);
                            }}
                          >
                            Roster
                          </button>
                        )}
                        {ev.current_status?.toLowerCase() === 'completed' && (
                          <button
                            style={{ display: 'block', padding: '5px 10px', backgroundColor: '#673AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', width: '100%' }}
                            onClick={() => {
                              setFeedbackEventId(ev.id);
                              setFeedbackModalOpen(true);
                              fetchFeedbackData(ev.id);
                            }}
                          >
                            Insights
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Approved History Content */}
          {activeNav === 'Approved by me' && (
            <div style={styles.contentCard}>
              <h2 style={styles.sectionTitle}>Events Approved by Me</h2>
              <p style={styles.sectionSub}>Historical log of all departmental events you have approved.</p>
              {approvedLoading ? (
                <p>Loading...</p>
              ) : approvedEvents.length === 0 ? (
                <div style={styles.emptyState}>
                  <span style={styles.emptyIcon}></span>
                  <p style={styles.emptyText}>No approved events found.</p>
                </div>
              ) : (
                <div style={styles.grid}>
                  {approvedEvents.map(ev => (
                    <div key={ev.id} style={{...styles.eventCard, position: 'relative', overflow: 'hidden'}}>
                      {/* Accent top border */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, ' + theme.colors.maroon + ', #FDD06F)' }} />
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', marginTop: '0.25rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', color: theme.colors.maroon, fontWeight: 'bold', lineHeight: 1.3, paddingRight: '0.5rem', flex: 1 }}>{ev.event_title}</h3>
                        <span style={{ ...styles.statusBadge(ev.current_status), margin: 0, padding: '4px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{ev.current_status}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flexGrow: 1, marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: '#777' }}>Proposed By</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>{ev.proposed_by}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: '#777' }}>Category</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>{ev.category}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: '#777' }}>Scale</span>
                          <span style={styles.scaleChip}>{ev.event_scale}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', paddingTop: '0.6rem', borderTop: '1px dashed #eee' }}>
                          <span style={{ fontSize: '0.85rem', color: '#777' }}>Budget</span>
                          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: theme.colors.maroon }}>₹{Number(ev.budget).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div style={{ paddingTop: '1rem', borderTop: '1px solid #f0f0f0', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <button
                          style={{ flex: '1 1 auto', padding: '8px 12px', backgroundColor: '#f0f0f0', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', transition: 'background 0.2s' }}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#e0e0e0'}
                          onMouseOut={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                          onClick={() => navigate(`/event-details/${ev.id}`)}
                        >
                          Timeline 
                        </button>
                        {['published', 'completed', 'pending_report'].includes(ev.current_status?.toLowerCase()) && (
                          <button
                            style={{ flex: '1 1 auto', padding: '8px 12px', backgroundColor: theme.colors.maroon, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', transition: 'background 0.2s' }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#6A0606'}
                            onMouseOut={(e) => e.target.style.backgroundColor = theme.colors.maroon}
                            onClick={() => {
                              setRosterEventId(ev.id);
                              setRosterModalOpen(true);
                            }}
                          >
                            Roster
                          </button>
                        )}
                        {ev.current_status?.toLowerCase() === 'completed' && (
                          <button
                            style={{ flex: '1 1 auto', padding: '8px 12px', backgroundColor: '#673AB7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', transition: 'background 0.2s' }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#512DA8'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#673AB7'}
                            onClick={() => {
                              setFeedbackEventId(ev.id);
                              setFeedbackModalOpen(true);
                              fetchFeedbackData(ev.id);
                            }}
                          >
                            Insights 
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeNav === 'Calendar' && (
            <div style={styles.contentCard}>
              <h2 style={styles.sectionTitle}>Event Calendar</h2>
              <p style={styles.sectionSub}>View your proposed and upcoming events.</p>
              <EventCalendar events={myEvents} />
            </div>
          )}

          {activeNav === 'Reports' && (
            <ReportsView user={user} />
          )}

          {activeNav === 'Archive' && (
            <EventArchive user={user} />
          )}

          {activeNav === 'Notifications' && (
            <NotificationView user={user} />
          )}

          {activeNav === 'Settings' && (
            <SettingsView user={user} />
          )}

        </>

      {/*  Attendee Roster Modal  */}
      {rosterModalOpen && (
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
            width: '100%', maxWidth: '800px',
            boxShadow: '0 24px 60px rgba(74,4,4,0.22)',
            overflow: 'hidden',
            animation: 'fadeSlideUp 0.22s ease',
            position: 'relative'
          }}>
            <button
              onClick={() => setRosterModalOpen(false)}
              style={{
                position: 'absolute', top: '15px', right: '20px',
                background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%',
                width: '32px', height: '32px', color: '#555', fontSize: '1.2rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 100,
              }}
            ><X size={20} /></button>
            <div style={{ padding: '1rem' }}>
              <AttendeeRoster eventId={rosterEventId} />
            </div>
          </div>
        </div>
      )}

      {/*  Remarks Modal  */}
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
                {remarksModal.action === 'approve' ? ' Approve Event' : ' Reject Event'}
              </h3>
              <button
                onClick={() => setRemarksModal({ open: false, eventId: null, action: null, scale: null, proposer_role: null })}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
              ></button>
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
                  onClick={() => setRemarksModal({ open: false, eventId: null, action: null, scale: null, proposer_role: null })}
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

      {/*  Feedback Insights Modal  */}
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
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontWeight: 700 }}> Event Insights & Feedback</h2>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem' }}>Student ratings and comments</p>
              </div>
              <button
                onClick={() => setFeedbackModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                  width: '32px', height: '32px', color: '#fff', fontSize: '1.2rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 100,
                }}
              ><X size={20} /></button>
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
                            <span style={{ color: '#FBC02D' }}>{''.repeat(fb.rating)}{''.repeat(5 - fb.rating)}</span>
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
    </DashboardLayout>
  );
}

//  Styles (Matching FacultyDashboard) 
const styles = {
  statIcon: {
    width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem', flexShrink: 0
  },
  statEmoji: { fontSize: '1.5rem' },
  statValue: { fontSize: '1.75rem', fontWeight: 'bold', margin: '0 0 0.25rem 0', color: '#111827' },
  statLabel: { margin: 0, color: '#6B7280', fontSize: '0.875rem', fontWeight: '500' },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  statCard: {
    background: 'linear-gradient(135deg, #ffffff 0%, #fdfbf7 100%)',
    borderRadius: '16px',
    padding: '1rem 1.25rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    border: '1px solid #eee',
    display: 'flex',
    alignItems: 'center'
  },
  statTitle: {
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    textTransform: 'uppercase'
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: theme.colors.maroon
  },
  root: {
    display: 'flex',
    minHeight: '100vh',
    background: theme.colors.offWhite || '#FAF8F5',
    fontFamily: theme.fonts.sansSerif,
  },
  
  // Sidebar
  sidebar: {
    width: '240px',
    minHeight: '100vh',
    background: theme.gradients.header,
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 0',
    transition: 'width 0.25s ease',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    overflowX: 'hidden',
  },
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
  tableRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderBottom: '1px solid #f0ede8', minWidth: '850px' },
  tableHeader: { background: '#FAF8F5', borderRadius: '6px 6px 0 0', fontWeight: 'bold', fontSize: '0.75rem', color: '#666', textTransform: 'uppercase' },
  tableCell: { fontSize: '0.875rem', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  categoryChip: { background: theme.colors.goldLight, color: '#7a4a00', borderRadius: '12px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 'bold' },
  scaleChip: { background: '#E0E7FF', color: '#3730A3', borderRadius: '12px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'capitalize' },
  approveBtn: { background: '#E6F4EA', color: '#137333', border: '1px solid #A5D6A7', padding: '0.5rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginRight: '0.3rem', fontSize: '0.8rem', transition: 'all 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' },
  rejectBtn: { background: '#FCE8E6', color: '#C5221F', border: '1px solid #F8BBD0', padding: '0.5rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', transition: 'all 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' },
  
  // Empty states
  emptyState: { textAlign: 'center', padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' },
  emptyIcon: { fontSize: '2.5rem', opacity: 0.5 },
  emptyText: { fontSize: '0.9rem', color: '#666' },
  errorBox: { background: '#FFEBEE', color: '#B71C1C', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid #EF9A9A' },
  successBox: { background: '#E8F5E9', color: '#1B5E20', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid #A5D6A7' },
  
  // Grid
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'stretch' },
  eventCard: { padding: '1.75rem', background: '#ffffff', border: '1px solid #eaeaea', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease-in-out' },
  eventTitle: { margin: '0 0 1rem', fontSize: '1.15rem', color: theme.colors.maroon, fontWeight: 'bold' },
  eventDetail: { margin: '0 0 0.6rem', fontSize: '0.95rem', color: '#555' },
  
  statusBadge: (status) => {
    let bg = '#E5E7EB'; let color = '#374151';
    if (status?.includes('approved')) { bg = '#E6F4EA'; color = '#137333'; }
    else if (status?.includes('pending')) { bg = '#FFF8E1'; color = '#C17F24'; }
    else if (status?.includes('rejected')) { bg = '#FCE8E6'; color = '#C5221F'; }
    return { background: bg, color: color, padding: '0.3rem 0.75rem', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' };
  }
};

function getGreeting() { const h = new Date().getHours(); if (h < 4) return 'Evening'; if (h < 12) return 'Morning'; if (h < 17) return 'Afternoon'; return 'Evening'; }
