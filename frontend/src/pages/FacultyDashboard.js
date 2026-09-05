/**
 * src/pages/FacultyDashboard.js
 * -----------------------------------------------------------------
 * Faculty / Organizer dashboard.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ SIDEBAR (maroon)   │  TOP BAR + MAIN CONTENT             │
 *   │  Logo              │  Welcome banner                     │
 *   │  Nav items         │  Stat cards (4)                     │
 *   │  User card         │  ─── Event Request Form ───         │
 *   │  Logout            │  Recent submissions list            │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Data flow:
 *   Form submit → POST /create_event.php → JSON → toast feedback
 *   proposed_by_id is taken from AuthContext (never from the form)
 * -----------------------------------------------------------------
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';
import theme from '../theme';
import AttendeeRoster from './AttendeeRoster';
import SettingsView from '../components/SettingsView';
import EventArchive from '../components/EventArchive';
import ReportsView from '../components/ReportsView';
import EventCalendar from '../components/EventCalendar';
import DashboardMetrics from '../components/DashboardMetrics';
import DashboardLayout from '../components/layout/DashboardLayout';
import { X, FileText, Clock, CheckCircle, CheckSquare, AlertTriangle } from 'lucide-react';


// ── Utility ─────────────────────────────────────────────────────────────────
const s = (...styles) => Object.assign({}, ...styles);

// ── Constants ───────────────────────────────────────────────────────────────
const CATEGORIES = ['Academic', 'Cultural', 'Sports'];

const STAT_CARDS = [
  { label: 'Total Submitted', key: 'total', icon: <FileText size={22} />, color: '#701a1e' },
  { label: 'Pending Approval', key: 'pending', icon: <Clock size={22} />, color: '#C17F24' },
  { label: 'Approved', key: 'approved', icon: <CheckCircle size={22} />, color: '#2E7D32' },
  { label: 'Completed', key: 'completed', icon: <CheckSquare size={22} />, color: '#1565C0' },
];

const NAV_ITEMS = [
  { icon: '', label: 'Dashboard', active: true },
  { icon: '', label: 'New Request', active: false },
  { icon: '', label: 'My Events', active: false },
  { icon: '', label: 'Calendar', active: false },
  { icon: '', label: 'Archive', active: false },
  { icon: '', label: 'Scanner', active: false },
  { icon: '', label: 'Reports', active: false },
  { icon: '', label: 'Settings', active: false },
];

// ── Initial form state ───────────────────────────────────────────────────────
const EMPTY_FORM = {
  event_title: '',
  description: '',
  event_date: '',
  registration_date: '',
  coordinator_name: '',
  coordinator_number: '',
  start_time: '',
  end_time: '',
  venue: '',
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
  sub_events: [{ name: '', description: '', participation_type: 'solo', max_participants: '', coordinator_name: '', coordinator_phone: '' }],
  participation_type: 'solo',
  max_team_size: '',
};

// ── Sub-components ───────────────────────────────────────────────────────────

/** Stat card widget */
function StatCard({ stat, value }) {
  return (
    <div style={styles.statCard}>
      <div style={s(styles.statIcon, { background: `${stat.color}18` })}>
        <span style={styles.statEmoji}>{stat.icon}</span>
      </div>
      <div>
        <p style={styles.statValue}>{value}</p>
        <p style={styles.statLabel}>{stat.label}</p>
      </div>
    </div>
  );
}

/** Success / error toast notification */
function Toast({ type, message, onClose }) {
  const isSuccess = type === 'success';
  return (
    <div style={s(styles.toast, isSuccess ? styles.toastSuccess : styles.toastError)}>
      <span style={styles.toastIcon}>{isSuccess ? <CheckCircle size={15} color="#1B5E20" /> : <AlertTriangle size={15} color="#B71C1C" />}</span>
      <span style={styles.toastMsg}>{message}</span>
      <button onClick={onClose} style={styles.toastClose}><X size={20} /></button>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function FacultyDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeNav, setActiveNav] = useState(
    () => localStorage.getItem('gmu_tab_faculty') || (location.state?.activeNav || 'Dashboard')
  );
  const handleNavChange = (nav) => {
    localStorage.setItem('gmu_tab_faculty', nav);
    setActiveNav(nav);
  };
  const [showProposeForm, setShowProposeForm] = useState(false);

  // Event form state
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

  // Recent submissions (optimistically updated after successful POST)
  const [recentEvents, setRecentEvents] = useState([]);

  // Stats counters — computed from DB data on mount, incremented optimistically on submit
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, completed: 0 });

  const [fetchLoading, setFetchLoading] = useState(true);

  const [systemEvents, setSystemEvents] = useState([]);

  // Available scales fetched dynamically from database
  const [availableScales, setAvailableScales] = useState([]);

  // State for the logistics form and file upload
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventMode, setSelectedEventMode] = useState('offline');
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [logistics, setLogistics] = useState({
    date: '', coordinator_name: '',
    time: '',
    venue: '',
    registration_deadline: '',
    max_participants: '',
    max_volunteers: '',
    max_coordinators: '',
    sub_events_logistics: []
  });

  // Roster modal state
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [rosterEventId, setRosterEventId] = useState(null);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportEventId, setReportEventId] = useState(null);
  const [reportSummary, setReportSummary] = useState('');
  const [reportFile, setReportFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Feedback Insights State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackEventId, setFeedbackEventId] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

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

  // The finalize mechanic
  const handleFinalizeEvent = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('event_id', selectedEventId);
    formData.append('event_date', logistics.date);
    formData.append('coordinator_name', form.coordinator_name);
    formData.append('event_time', logistics.time);
    formData.append('venue', logistics.venue);
    formData.append('registration_deadline', logistics.registration_deadline);
    if (logistics.max_participants !== '') formData.append('max_participants', logistics.max_participants);
    if (logistics.max_volunteers !== '') formData.append('max_volunteers', logistics.max_volunteers);
    if (logistics.max_coordinators !== '') formData.append('max_coordinators', logistics.max_coordinators);
    formData.append('sub_events_logistics', JSON.stringify(logistics.sub_events_logistics));

    try {
      const res = await fetch(`${API_BASE}/finalize_event.php`, {
        method: 'POST',
        body: formData, // fetch sets correct boundaries
      });
      const json = await res.json();
      if (json.success) {
        setUploadModalOpen(false);
        setToast({ type: 'success', message: json.message || 'Logistics updated!' });

        // Optimistically update the list
        setRecentEvents((prev) =>
          prev.map((ev) => ev.id === selectedEventId ? { ...ev, status: 'published' } : ev)
        );
        setStats(prev => ({ ...prev, approved: prev.approved - 1, completed: prev.completed + 1 }));
      } else {
        alert("Error: " + json.message);
      }
    } catch (err) {
      alert("Network error.");
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportSummary.trim() && !reportFile) {
      alert("Please provide either a report summary or a PDF file.");
      return;
    }
    if (galleryFiles.length < 1 || galleryFiles.length > 10) {
      alert("Please upload between 1 and 10 event photos for the gallery.");
      return;
    }

    setReportSubmitting(true);

    const formData = new FormData();
    formData.append('event_id', reportEventId);
    formData.append('faculty_id', user.username);
    formData.append('report_summary', reportSummary);
    if (reportFile) {
      formData.append('report_file', reportFile);
    }
    // Attach gallery images
    Array.from(galleryFiles).forEach((file) => {
      formData.append('gallery_images[]', file);
    });

    try {
      const res = await fetch(`${API_BASE}/submit_event_report.php`, {
        method: 'POST',
        // FormData automatically sets the boundary headers, so no Content-Type here
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: 'Event completed and report submitted!' });
        setReportModalOpen(false);
        setReportSummary('');
        setReportFile(null);
        setRecentEvents(prev => prev.map(evt =>
          evt.id === reportEventId ? { ...evt, status: 'completed' } : evt
        ));
        setStats(prev => ({
          ...prev,
          completed: prev.completed + 1
        }));
      } else {
        setToast({ type: 'error', message: data.message });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Network error submitting report.' });
    } finally {
      setReportSubmitting(false);
    }
  };

  // ── Fetch events on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const fetchMyEvents = async () => {
      setFetchLoading(true);
      try {
        const res = await fetch(`${API_BASE}/get_my_events.php?user_id=${user.username}`);
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          // Map DB rows → the shape the table expects
          const mapped = json.data.map((evt) => ({
            id: evt.id,
            event_title: evt.event_title,
            category: evt.category,
            event_scale: evt.event_scale,
            budget: evt.budget,
            status: evt.current_status,
            remarks: evt.remarks,
            event_mode: evt.event_mode,
            details: evt.details,
            submitted_at: new Date(evt.created_at).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
            }),
          }));

          setRecentEvents(mapped);

          setStats({
            total: json.data.length,
            pending: json.data.filter((e) => {
              const st = e.current_status?.toLowerCase() || '';
              return st.startsWith('pending');
            }).length,
            approved: json.data.filter((e) => {
              const st = e.current_status?.toLowerCase() || '';
              return st === 'approved' || st === 'published';
            }).length,
            completed: json.data.filter((e) => e.current_status?.toLowerCase() === 'completed').length,
          });
        } else {
          // API returned success:false — show a non-blocking error
          console.error('get_my_events.php error:', json.message);
        }
      } catch (err) {
        // Network failure — dashboard is still usable; warn in console
        console.error('Failed to fetch events:', err);
      } finally {
        setFetchLoading(false);
      }
    };

    const fetchScales = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_approval_rules.php`);
        const json = await res.json();
        if (json.success) {
          setAvailableScales(json.data.map(r => r.scale_name));
        }
      } catch (err) {
        console.error('Failed to fetch scales');
      }
    };

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

    fetchMyEvents();
    fetchScales();
    fetchSystemEvents();
  }, [user]); // re-runs if the logged-in user changes (e.g. after login)


  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field-level error on change
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  /** Client-side validation — returns true if form is valid */
  const validateForm = () => {
    const errs = {};
    if (!form.event_title.trim()) {
      errs.event_title = 'Event title is required.';
    } else if (form.event_title.trim().length > 255) {
      errs.event_title = 'Title must be 255 characters or fewer.';
    }
    if (!form.category) {
      errs.category = 'Please select a category.';
    }
    if (!form.event_scale) {
      errs.event_scale = 'Please select an event scale.';
    }
    if (form.budget === '' || isNaN(Number(form.budget)) || Number(form.budget) < 0) {
      errs.budget = 'Enter a valid budget amount (≥ 0).';
    }
    if (!form.brochureFile) {
      errs.brochureFile = 'Please upload a brochure for the proposal.';
    }
    if (form.participation_type === 'group' && (!form.max_team_size || form.max_team_size < 2)) {
      errs.max_team_size = 'Max team size must be at least 2 for group events.';
    }
    if (form.event_mode === 'offline' && !form.venue.trim()) {
      errs.venue = 'Venue is required for offline events.';
    }
    if (!form.coordinator_name?.trim()) {
      errs.coordinator_name = 'Coordinator name is required.';
    }
    if (!form.coordinator_number?.trim() || !/^\d{10}$/.test(form.coordinator_number)) {
      errs.coordinator_number = 'Coordinator number must be exactly 10 digits.';
    }
    setFormErrors(errs);
    return errs;
  };

  /** Submits the form to create_event.php */

  // ── Submit handler ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      const firstField = Object.keys(errs)[0];
      setToast({ type: 'error', message: `Please fill out or fix: ${firstField.replace('_', ' ')}` });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('event_title', form.event_title);
      formData.append('description', form.description);
      formData.append('event_date', form.event_date);
      formData.append('registration_date', form.registration_date);
      formData.append('coordinator_name', form.coordinator_name);
      formData.append('coordinator_number', form.coordinator_number);
      formData.append('start_time', form.start_time);
      formData.append('end_time', form.end_time);
      formData.append('venue', form.venue);
      formData.append('category', form.category);
      formData.append('event_scale', form.event_scale);
      formData.append('event_mode', form.event_mode);
      formData.append('budget', form.budget);
      formData.append('immediate_approval', form.immediate_approval);
      formData.append('proposed_by_id', user.username);
      formData.append('role', user.role);
      formData.append('brochure', form.brochureFile);
      if (form.max_participants) formData.append('max_participants', form.max_participants);
      if (form.max_volunteers) formData.append('max_volunteers', form.max_volunteers);
      if (form.is_festival) {
        formData.append('is_festival', 'true');
        formData.append('sub_events', JSON.stringify(form.sub_events.filter(s => s.name && s.name.trim() !== '')));
      }
      formData.append('participation_type', form.participation_type);
      if (form.participation_type === 'group' && form.max_team_size) {
        formData.append('max_team_size', form.max_team_size);
      }

      const res = await fetch(`${API_BASE}/create_event.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('jwt_token')}`
        },
        body: formData,
      });

      const json = await res.json();

      if (json.success) {
        // Optimistically add the new event to the list
        const newEvent = {
          id: json.event_id ?? Date.now(),
          event_title: form.event_title,
          category: form.category,
          event_scale: form.event_scale,
          budget: form.budget,
          status: json.status_assigned || 'Pending',
          submitted_at: new Date().toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
          }),
        };
        setRecentEvents((prev) => [newEvent, ...prev]);
        setStats((prev) => ({
          ...prev,
          total: prev.total + 1,
          pending: prev.pending + 1,
        }));
        setForm(EMPTY_FORM);
        setShowProposeForm(false);
        setToast({ type: 'success', message: 'Event request submitted successfully! ' });
      } else {
        setToast({ type: 'error', message: json.message || 'Submission failed. Please try again.' });
      }
    } catch (err) {
      console.error('Submit error:', err);
      setToast({ type: 'error', message: 'Cannot reach the server. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  };


  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout role="faculty" activeNav={activeNav} onNavChange={handleNavChange} onOpenSettings={() => setActiveNav('Settings')}>
      <>

        {/* Toast notification */}
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}

        {/* Welcome banner */}
        {activeNav === 'Dashboard' && (
          <div style={styles.welcomeBanner}>
            <div>
              <h2 style={styles.welcomeTitle}>
                Good {getGreeting()}, {user?.name?.split(' ')[0]}
              </h2>
              <p style={styles.welcomeSub}>
                Submit a new event request or track the status of your existing proposals.
              </p>
            </div>
            <div style={styles.welcomeDecor}>
              <span style={styles.welcomeIcon}></span>
            </div>
          </div>
        )}

        {/* Stat cards */}
        {activeNav === 'Dashboard' && (
          <div style={styles.statsRow}>
            {STAT_CARDS.map((stat) => (
              <StatCard key={stat.key} stat={stat} value={stats[stat.key]} />
            ))}
          </div>
        )}

        {/* Dashboard Metrics — side-by-side grid to stay above the fold */}
        {activeNav === 'Dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: '#fff', borderRadius: theme.radii.xl, padding: '1.25rem 1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: '1px solid #f0ebe1' }}>
              <h3 style={{ fontSize: '0.95rem', color: theme.colors.maroon, fontWeight: 700, marginBottom: '0.75rem', marginTop: 0 }}>Event Status Overview</h3>
              <DashboardMetrics
                data={[
                  { name: 'Pending', count: stats.pending },
                  { name: 'Approved', count: stats.approved },
                  { name: 'Completed', count: stats.completed }
                ]}
                barName="Total Items"
              />
            </div>
          </div>
        )}

        {/* ── Event Request Form ─────────────────────────── */}
        {activeNav === 'Events' && showProposeForm && (
          <div style={styles.formCard}>
            {/* Card header accent */}
            <div style={styles.formCardAccent} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #f0ede8', paddingBottom: '1rem' }}>
              <div>
                <h2 style={styles.formCardTitle}> New Event Request</h2>
                <p style={styles.formCardSub}>
                  Complete the form below. Your request will be routed for approval automatically.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={styles.statusPill}>
                  <span style={styles.statusDot} /> Status: Pending on Submit
                </div>
                <button
                  onClick={() => setShowProposeForm(false)}
                  style={{ padding: '0.6rem 1.2rem', backgroundColor: '#e0e0e0', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Back to List
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate style={styles.form}>

              {/* Row 1: Title + Category */}
              <div style={styles.formRow}>
                {/* Event Title */}
                <div style={s(styles.formGroup, { flex: 2 })}>
                  <label htmlFor="event_title" style={styles.formLabel}>
                    Event Title <span style={styles.required}>*</span>
                  </label>
                  <input
                    id="event_title"
                    type="text"
                    value={form.event_title}
                    onChange={(e) => handleFieldChange('event_title', e.target.value)}
                    placeholder="e.g. Annual Tech Symposium 2026"
                    style={s(styles.formInput, formErrors.event_title && styles.inputError)}
                    disabled={loading}
                    maxLength={255}
                  />
                  {formErrors.event_title && (
                    <p style={styles.fieldError}>{formErrors.event_title}</p>
                  )}
                </div>

                {/* Category */}
                <div style={s(styles.formGroup, { flex: 1 })}>
                  <label htmlFor="category" style={styles.formLabel}>
                    Category <span style={styles.required}>*</span>
                  </label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                    style={s(styles.formInput, styles.formSelect, formErrors.category && styles.inputError)}
                    disabled={loading}
                  >
                    <option value="">— Select —</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <p style={styles.fieldError}>{formErrors.category}</p>
                  )}
                </div>

                {/* Scale */}
                <div style={s(styles.formGroup, { flex: 1 })}>
                  <label htmlFor="event_scale" style={styles.formLabel}>
                    Event Scale <span style={styles.required}>*</span>
                  </label>
                  <select
                    id="event_scale"
                    value={form.event_scale}
                    onChange={(e) => handleFieldChange('event_scale', e.target.value)}
                    style={s(styles.formInput, styles.formSelect, formErrors.event_scale && styles.inputError)}
                    disabled={loading}
                  >
                    <option value="">— Select —</option>
                    {availableScales.map((c) => (
                      <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>
                    ))}
                  </select>
                  {formErrors.event_scale && (
                    <p style={styles.fieldError}>{formErrors.event_scale}</p>
                  )}
                </div>
              </div>

              {/* Event Mode — Online / Offline toggle */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>
                  Event Mode <span style={styles.required}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                  {['offline', 'online'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleFieldChange('event_mode', mode)}
                      style={{
                        padding: '0.5rem 1.5rem',
                        borderRadius: '20px',
                        border: `2px solid ${form.event_mode === mode ? theme.colors.maroon : '#ddd'}`,
                        background: form.event_mode === mode ? theme.colors.maroon : '#fff',
                        color: form.event_mode === mode ? '#fff' : '#555',
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
              </div>
              {/* Participation Type — Solo / Group toggle */}
              <div style={styles.formRow}>
                {!(form.is_festival) && (<>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Participation Type <span style={styles.required}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                      {['solo', 'group'].map(ptype => (
                        <button
                          key={ptype}
                          type="button"
                          onClick={() => handleFieldChange('participation_type', ptype)}
                          style={{
                            padding: '0.5rem 1.5rem',
                            borderRadius: '20px',
                            border: `2px solid ${form.participation_type === ptype ? theme.colors.maroon : '#ddd'}`,
                            background: form.participation_type === ptype ? theme.colors.maroon : '#fff',
                            color: form.participation_type === ptype ? '#fff' : '#555',
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

                  {form.participation_type === 'group' && (
                    <div style={styles.formGroup}>
                      <label htmlFor="max_team_size" style={styles.formLabel}>
                        Max Team Size <span style={styles.required}>*</span>
                      </label>
                      <input
                        id="max_team_size"
                        type="number"
                        min="2"
                        value={form.max_team_size}
                        onChange={(e) => handleFieldChange('max_team_size', e.target.value)}
                        placeholder="e.g. 4"
                        style={s(styles.formInput, formErrors.max_team_size && styles.inputError)}
                        disabled={loading}
                      />
                      {formErrors.max_team_size && (
                        <p style={styles.fieldError}>{formErrors.max_team_size}</p>
                      )}
                    </div>
                  )}

                </>)}
                {/* Start Time */}
                <div style={styles.formGroup}>
                  <label htmlFor="start_time" style={styles.formLabel}>
                    Start Time <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    value={form.start_time || ''}
                    onChange={(e) => handleFieldChange('start_time', e.target.value)}
                    style={styles.formInput}
                    required
                  />
                </div>

                {/* End Time */}
                <div style={styles.formGroup}>
                  <label htmlFor="end_time" style={styles.formLabel}>
                    End Time <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    value={form.end_time || ''}
                    onChange={(e) => handleFieldChange('end_time', e.target.value)}
                    style={styles.formInput}
                    required
                  />
                </div>

                {/* Venue */}
                <div style={styles.formGroup}>
                  <label htmlFor="venue" style={styles.formLabel}>
                    Venue <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="venue"
                    name="venue"
                    value={form.venue || ''}
                    onChange={(e) => handleFieldChange('venue', e.target.value)}
                    style={styles.formInput}
                    placeholder="e.g. Main Auditorium"
                    required
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.4rem' }}>
                  {form.event_mode === 'offline'
                    ? 'Venue is required for offline events (set during logistics).'
                    : 'No venue needed — event will be held virtually.'}
                </p>
              </div>

              {/* Sub-Events Toggle */}
              <div style={s(styles.formGroup, { marginTop: '1rem', padding: '1rem', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' })}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#333', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={form.is_festival}
                    onChange={(e) => handleFieldChange('is_festival', e.target.checked)}
                    disabled={loading}
                    style={{ width: '18px', height: '18px', accentColor: theme.colors.maroon }}
                  />
                  This is a Festival / Mega-Event (Has Sub-Events)
                </label>

                {form.is_festival && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>List the sub-events included in this festival:</p>
                    {form.sub_events.map((sub, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed #ccc' }}>
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) => {
                            const newSubs = [...form.sub_events];
                            newSubs[idx].name = e.target.value;
                            handleFieldChange('sub_events', newSubs);
                          }}
                          placeholder={`Sub-Event ${idx + 1} Name`}
                          style={s(styles.formInput, { padding: '8px', flex: 1 })}
                          disabled={loading}
                          required={form.is_festival}
                        />
                        <textarea
                          value={sub.description}
                          onChange={(e) => {
                            const newSubs = [...form.sub_events];
                            newSubs[idx].description = e.target.value;
                            handleFieldChange('sub_events', newSubs);
                          }}
                          placeholder="Sub-Event Description"
                          style={s(styles.formInput, { padding: '8px', flex: 1 })}
                          disabled={loading}
                          rows="2"
                          required={form.is_festival}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <select
                            value={sub.participation_type || 'solo'}
                            onChange={(e) => {
                              const newSubs = [...form.sub_events];
                              newSubs[idx].participation_type = e.target.value;
                              handleFieldChange('sub_events', newSubs);
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
                                  const newSubs = [...form.sub_events];
                                  newSubs[idx].max_groups = e.target.value;
                                  handleFieldChange('sub_events', newSubs);
                                }}
                                placeholder="Max Groups"
                                style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                              />
                              <input
                                type="number"
                                value={sub.max_team_size || ''}
                                onChange={(e) => {
                                  const newSubs = [...form.sub_events];
                                  newSubs[idx].max_team_size = e.target.value;
                                  handleFieldChange('sub_events', newSubs);
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
                                const newSubs = [...form.sub_events];
                                newSubs[idx].max_participants = e.target.value;
                                handleFieldChange('sub_events', newSubs);
                              }}
                              placeholder="Max Participants"
                              style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                            />
                          )}
                          <input
                            type="text"
                            value={sub.coordinator_name || ''}
                            onChange={(e) => {
                              const newSubs = [...form.sub_events];
                              newSubs[idx].coordinator_name = e.target.value;
                              handleFieldChange('sub_events', newSubs);
                            }}
                            placeholder="Coordinator Name"
                            style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                          />
                          <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            value={sub.coordinator_phone || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              const newSubs = [...form.sub_events];
                              newSubs[idx].coordinator_phone = val;
                              handleFieldChange('sub_events', newSubs);
                            }}
                            placeholder="Coordinator Phone (10 digits)"
                            style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                          />
                          <input
                            type="text"
                            value={sub.venue || ''}
                            onChange={(e) => {
                              const newSubs = [...form.sub_events];
                              newSubs[idx].venue = e.target.value;
                              handleFieldChange('sub_events', newSubs);
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
                                const newSubs = [...form.sub_events];
                                newSubs[idx].start_time = e.target.value;
                                handleFieldChange('sub_events', newSubs);
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
                                const newSubs = [...form.sub_events];
                                newSubs[idx].end_time = e.target.value;
                                handleFieldChange('sub_events', newSubs);
                              }}
                              style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                            />
                          </div>
                        </div>
                        {form.sub_events.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newSubs = form.sub_events.filter((_, i) => i !== idx);
                              handleFieldChange('sub_events', newSubs);
                            }}
                            style={{ alignSelf: 'flex-start', padding: '4px 8px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                          >Remove</button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleFieldChange('sub_events', [...form.sub_events, { name: '', description: '', participation_type: 'solo', max_participants: '', coordinator_name: '', coordinator_phone: '' }])}
                      style={{ marginTop: '0.5rem', padding: '6px 12px', background: '#e0f7fa', color: '#006064', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                    >
                      + Add Another Sub-Event
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={styles.formGroup}>
                <label htmlFor="description" style={styles.formLabel}>
                  Description <span style={styles.required}>*</span>
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="Describe the event objectives, expected participants, agenda highlights…"
                  rows={4}
                  style={s(styles.formInput, styles.formTextarea)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Event Date (Optional at this stage) */}
              <div style={styles.formGroup}>
                <label htmlFor="event_date" style={styles.formLabel}>
                  Event Date <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  id="event_date"
                  type="date"
                  value={form.event_date || ''}
                  onChange={(e) => handleFieldChange('event_date', e.target.value)}
                  style={styles.formInput}
                  disabled={loading}
                />
              </div>

              {/* Registration Date */}
              <div style={styles.formGroup}>
                <label htmlFor="registration_date" style={styles.formLabel}>
                  Registration Date (Deadline) <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  id="registration_date"
                  type="date"
                  value={form.registration_date || ''}
                  onChange={(e) => handleFieldChange('registration_date', e.target.value)}
                  style={styles.formInput}
                  disabled={loading}
                  required
                />
              </div>


              {/* Max Participants — hidden for festivals (captured per sub-event) */}
              {!form.is_festival && (
                <div style={styles.formGroup}>
                  <label htmlFor="max_participants" style={styles.formLabel}>
                    Max Participants <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    id="max_participants"
                    type="number"
                    min="1"
                    value={form.max_participants || ''}
                    onChange={(e) => handleFieldChange('max_participants', e.target.value)}
                    style={styles.formInput}
                    disabled={loading}
                    required
                  />
                </div>
              )}

              <div style={styles.formRow}>
                {/* Coordinator Name */}
                <div style={s(styles.formGroup, { flex: 1 })}>
                  <label htmlFor="coordinator_name" style={styles.formLabel}>
                    Coordinator Name <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    id="coordinator_name"
                    type="text"
                    value={form.coordinator_name || ''}
                    onChange={(e) => handleFieldChange('coordinator_name', e.target.value)}
                    style={styles.formInput}
                    placeholder="e.g. Dr. John Doe"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Coordinator Number */}
                <div style={s(styles.formGroup, { flex: 1 })}>
                  <label htmlFor="coordinator_number" style={styles.formLabel}>
                    Coordinator Number <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    id="coordinator_number"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.coordinator_number || ''}
                    onChange={(e) => handleFieldChange('coordinator_number', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    style={s(styles.formInput, formErrors.coordinator_number && styles.inputError)}
                    placeholder="10-digit phone number"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Brochure File */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Brochure Document <span style={styles.required}>*</span></label>
                <input
                  style={s(styles.formInput, formErrors.brochureFile && styles.inputError)}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFieldChange('brochureFile', e.target.files[0])}
                  disabled={loading}
                />
                {formErrors.brochureFile && <p style={styles.fieldError}>{formErrors.brochureFile}</p>}
                <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.4rem' }}>
                  Upload the official event brochure (PDF/JPG/PNG). This will be reviewed by authorities.
                </p>
              </div>

              {/* Budget */}
              <div style={s(styles.formGroup, { maxWidth: '320px' })}>
                <label htmlFor="budget" style={styles.formLabel}>
                  Estimated Budget (₹) <span style={styles.required}>*</span>
                </label>
                <div style={styles.budgetWrap}>
                  <span style={styles.budgetPrefix}>₹</span>
                  <input
                    id="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.budget}
                    onChange={(e) => handleFieldChange('budget', e.target.value)}
                    placeholder="0.00"
                    style={s(styles.formInput, styles.budgetInput, formErrors.budget && styles.inputError)}
                    disabled={loading}
                  />
                </div>
                {formErrors.budget && (
                  <p style={styles.fieldError}>{formErrors.budget}</p>
                )}
              </div>

              {/* Capacities */}
              <div style={s(styles.formGroup, { marginTop: '1rem', padding: '1rem', background: '#fcfcfc', border: '1px solid #eee', borderRadius: '8px' })}>
                <label style={s(styles.formLabel, { marginBottom: '0.8rem' })}>
                  Event Capacities <span style={styles.optional}>(optional)</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                  {!form.is_festival && (
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>Max Participants</label>
                      <input
                        type="number"
                        min="1"
                        value={form.max_participants}
                        onChange={(e) => handleFieldChange('max_participants', e.target.value)}
                        placeholder="e.g. 100"
                        style={s(styles.formInput, { padding: '8px' })}
                        disabled={loading}
                      />
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>Max Volunteers</label>
                    <input
                      type="number"
                      min="0"
                      value={form.max_volunteers}
                      onChange={(e) => handleFieldChange('max_volunteers', e.target.value)}
                      placeholder="e.g. 10"
                      style={s(styles.formInput, { padding: '8px' })}
                      disabled={loading}
                    />
                  </div>
                </div>

              </div>

              {/* Submit row */}
              <div style={styles.submitRow}>
                <button
                  type="button"
                  onClick={() => { setForm(EMPTY_FORM); setFormErrors({}); }}
                  style={styles.resetBtn}
                  disabled={loading}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  style={s(styles.submitBtn, loading && styles.submitBtnDisabled)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span style={styles.spinner} /> Submitting…
                    </>
                  ) : (
                    ' Submit Event Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Recent Submissions ────────────────────────── */}
        {activeNav === 'Events' && !showProposeForm && (
          <div style={styles.recentCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h3 style={{ ...styles.recentTitle, margin: 0 }}> My Recent Submissions</h3>
              <button
                onClick={() => setShowProposeForm(true)}
                style={{ padding: '0.6rem 1.2rem', backgroundColor: theme.colors.maroon, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                + New Proposal
              </button>
            </div>

            {fetchLoading ? (
              /* Loading spinner while API call is in-flight */
              <div style={styles.emptyState}>
                <span style={styles.fetchSpinner} />
                <p style={styles.emptyText}>Loading your submissions…</p>
              </div>
            ) : recentEvents.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}></span>
                <p style={styles.emptyText}>No submissions yet. Use the form above to get started!</p>
              </div>
            ) : (
              <div style={styles.table}>
                {/* Table header */}
                <div style={s(styles.tableRow, styles.tableHeader)}>
                  <span style={s(styles.tableCell, { flex: 3 })}>Event Title</span>
                  <span style={s(styles.tableCell, { flex: 1 })}>Scale</span>
                  <span style={s(styles.tableCell, { flex: 1 })}>Category</span>
                  <span style={s(styles.tableCell, { flex: 1 })}>Budget</span>
                  <span style={s(styles.tableCell, { flex: 1 })}>Status</span>
                </div>
                {recentEvents.map((evt) => (
                  <div key={evt.id} style={styles.tableRow}>
                    <span style={s(styles.tableCell, { flex: 3, fontWeight: 500 })}>
                      {evt.event_title}
                    </span>
                    <span style={s(styles.tableCell, { flex: 1 })}>
                      <span style={styles.scaleChip}>{evt.event_scale}</span>
                    </span>
                    <span style={s(styles.tableCell, { flex: 1 })}>
                      <span style={styles.categoryChip}>{evt.category}</span>
                    </span>
                    <span style={s(styles.tableCell, { flex: 1 })}>
                      ₹{Number(evt.budget).toLocaleString('en-IN')}
                    </span>
                    <span style={s(styles.tableCell, { flex: 1 })}>
                      <StatusBadge status={evt.status} />
                      {!['published', 'completed', 'pending_report'].includes(evt.status?.toLowerCase()) && (
                        <button
                          style={{ marginTop: '8px', display: 'block', padding: '5px 10px', backgroundColor: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', width: '100%', fontWeight: '500' }}
                          onClick={() => navigate(`/event-details/${evt.id}`)}
                        >
                          Track Status
                        </button>
                      )}
                      {evt.remarks && (
                        <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#666', background: '#f5f5f5', padding: '6px', borderRadius: '4px', borderLeft: '3px solid #ccc', whiteSpace: 'normal', wordBreak: 'break-word', overflow: 'visible' }}>
                          <strong>Notes:</strong> {evt.remarks}
                        </div>
                      )}

                      {evt.status?.toLowerCase() === 'approved' && (
                        <button
                          style={{ marginTop: '8px', display: 'block', padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', width: '100%' }}
                          onClick={() => {
                            setSelectedEventId(evt.id);
                            setSelectedEventMode(evt.event_mode || 'offline');
                            setSelectedEventDetails(evt.details || null);
                            setLogistics(prev => ({
                              ...prev,
                              sub_events_logistics: evt.details?.is_festival && Array.isArray(evt.details?.sub_events)
                                ? evt.details.sub_events.map(sub => ({ name: typeof sub === 'string' ? sub : sub.name, description: typeof sub === 'string' ? '' : sub.description, venue: '', start_time: '', end_time: '' }))
                                : []
                            }));
                            setUploadModalOpen(true);
                          }}
                        >
                          Finalize Event
                        </button>
                      )}

                      {['published', 'completed', 'pending_report'].includes(evt.status?.toLowerCase()) && (
                        <button
                          style={{ marginTop: '8px', display: 'block', padding: '5px 10px', backgroundColor: theme.colors.maroon, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', width: '100%' }}
                          onClick={() => {
                            setRosterEventId(evt.id);
                            setRosterModalOpen(true);
                          }}
                        >
                          View Roster
                        </button>
                      )}

                      {['published', 'pending_report'].includes(evt.status?.toLowerCase()) && (
                        <button
                          style={{ marginTop: '8px', display: 'block', padding: '5px 10px', backgroundColor: theme.colors.info, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', width: '100%' }}
                          onClick={() => {
                            setReportEventId(evt.id);
                            setReportModalOpen(true);
                          }}
                        >
                          Submit Final Report
                        </button>
                      )}

                      {evt.status?.toLowerCase() === 'completed' && (
                        <button
                          style={{ marginTop: '8px', display: 'block', padding: '5px 10px', backgroundColor: '#673AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', width: '100%' }}
                          onClick={() => {
                            setFeedbackEventId(evt.id);
                            setFeedbackModalOpen(true);
                            fetchFeedbackData(evt.id);
                          }}
                        >
                          Insights / Feedback
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Calendar Content */}
        {activeNav === 'Calendar' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', padding: '0.5rem 0' }}>
            <div style={{ marginBottom: '0.75rem', flexShrink: 0 }}>
              <h2 style={styles.sectionTitle}>Event Calendar</h2>
              <p style={styles.sectionSub}>View your schedule and upcoming university events.</p>
            </div>
            <EventCalendar events={[...new Map([...systemEvents, ...recentEvents].map(e => [e.id, e])).values()]} />
          </div>
        )}

        {activeNav === 'Archive' && (
          <EventArchive user={user} />
        )}


        {activeNav === 'Settings' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <SettingsView user={user} />
          </div>
        )}

        {/* ── Reports ────────────────────────────────── */}
        {(activeNav === 'Reports') && (
          <ReportsView user={user} />
        )}

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
              animation: 'fadeSlideUp 0.22s ease',
            }}>
              {/* Modal header */}
              <div style={{
                background: 'linear-gradient(135deg, #673AB7 0%, #512DA8 100%)',
                padding: '1.5rem 1.75rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0
              }}>
                <div>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontWeight: 700 }}>
                    Event Insights & Feedback
                  </h2>
                  <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem' }}>
                    Student ratings and comments
                  </p>
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

              {/* Modal body */}
              <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                {feedbackLoading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading insights...</div>
                ) : !feedbackData ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Could not load feedback.</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                      <div style={{ flex: 1, background: '#F5F5F5', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#673AB7' }}>
                          {feedbackData.average_rating}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Average Rating
                        </div>
                      </div>
                      <div style={{ flex: 1, background: '#F5F5F5', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#673AB7' }}>
                          {feedbackData.total_feedback}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Total Responses
                        </div>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1rem', color: '#333', marginBottom: '1rem', borderBottom: '2px solid #EEE', paddingBottom: '0.5rem' }}>
                      Student Comments
                    </h3>

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
                            <small style={{ color: '#999', fontSize: '0.75rem' }}>
                              {new Date(fb.created_at).toLocaleDateString()}
                            </small>
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

        {/* ── Report Submission Modal ──────────────────────────────── */}
        {reportModalOpen && (
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
              width: '100%', maxWidth: '500px',
              boxShadow: '0 24px 60px rgba(74,4,4,0.22)',
              overflow: 'hidden',
              animation: 'fadeSlideUp 0.22s ease',
            }}>
              {/* Modal header */}
              <div style={{
                background: 'linear-gradient(135deg, #4A0404 0%, #7B1A1A 100%)',
                padding: '1.5rem 1.75rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <h2 style={{ margin: 0, color: '#FDD06F', fontSize: '1.15rem', fontWeight: 700 }}>
                    Submit Post-Event Report
                  </h2>
                  <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem' }}>
                    Mark event as completed by providing a summary or uploading a PDF.
                  </p>
                </div>
                <button
                  onClick={() => setReportModalOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                    width: '32px', height: '32px', color: '#fff', fontSize: '1.2rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s',
                    zIndex: 100,
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                ><X size={20} /></button>
              </div>

              <form onSubmit={handleReportSubmit} style={{ padding: '1.75rem' }}>
                <div style={styles.formGroup}>
                  <label style={{ ...styles.label, fontWeight: 600, color: '#333' }}>Written Summary (Optional)</label>
                  <textarea
                    style={{ ...styles.input, minHeight: '120px', resize: 'vertical', borderRadius: '12px', padding: '1rem', border: '1px solid #E0E0E0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                    value={reportSummary}
                    onChange={(e) => setReportSummary(e.target.value)}
                    placeholder="Summarize key highlights, achievements, and feedback..."
                  />
                </div>

                <div style={{ ...styles.formGroup, marginTop: '1.5rem' }}>
                  <label style={{ ...styles.label, fontWeight: 600, color: '#333' }}>Upload PDF Report (Optional)</label>
                  <div style={{
                    position: 'relative',
                    border: '2px dashed #BDBDBD',
                    borderRadius: '12px',
                    background: '#FAFAFA',
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#7B1A1A'; e.currentTarget.style.background = '#FFF5F5'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#BDBDBD'; e.currentTarget.style.background = '#FAFAFA'; }}
                  >
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setReportFile(e.target.files[0] || null)}
                      style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        opacity: 0, cursor: 'pointer'
                      }}
                    />
                    <div style={{ pointerEvents: 'none' }}>
                      <div style={{ marginBottom: '0.5rem', color: '#7B1A1A' }}>
                        <FileText size={32} style={{ margin: '0 auto' }} />
                      </div>
                      <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: '#333' }}>
                        {reportFile ? reportFile.name : 'Click or drag PDF here to upload'}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                        {reportFile ? `${(reportFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Max size: 5MB (PDF only)'}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button
                    type="button"
                    style={s(styles.resetBtn, { flex: 1 })}
                    onClick={() => setReportModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={s(styles.submitBtn, reportSubmitting && styles.submitBtnDisabled, { flex: 2, background: '#4A0404' })}
                    disabled={reportSubmitting}
                  >
                    {reportSubmitting ? 'Submitting...' : 'Mark as Completed'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Brochure Upload Modal ──────────────────────────────── */}
        {uploadModalOpen && (
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
              width: '100%', maxWidth: '480px',
              boxShadow: '0 24px 60px rgba(74,4,4,0.22)',
              overflow: 'hidden',
              animation: 'fadeSlideUp 0.22s ease',
            }}>
              {/* Modal header */}
              <div style={{
                background: 'linear-gradient(135deg, #4A0404 0%, #7B1A1A 100%)',
                padding: '1.5rem 1.75rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <h2 style={{ margin: 0, color: '#FDD06F', fontSize: '1.15rem', fontWeight: 700 }}>
                    Finalize Event
                  </h2>
                  <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem' }}>
                    Lock in logistics and upload the event brochure
                  </p>
                </div>
                <button
                  onClick={() => setUploadModalOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
                    width: '32px', height: '32px', color: '#fff', fontSize: '1rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                    zIndex: 100,
                  }}
                ><X size={20} /></button>
              </div>

              {/* Modal body */}
              <form onSubmit={handleFinalizeEvent} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', maxHeight: '75vh', overflowY: 'auto' }}>

                {/* Date + Time row */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Event Date
                    </label>
                    <input
                      type="date" required
                      onChange={(e) => setLogistics({ ...logistics, date: e.target.value })}
                      style={{
                        width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.9rem',
                        border: '1.5px solid #E0E0E0', borderRadius: '8px',
                        outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color 0.15s',
                        fontFamily: 'inherit',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#4A0404'}
                      onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {selectedEventDetails?.is_festival ? 'Main Event / Inauguration Time' : 'Event Time'}
                    </label>
                    <input
                      type="time" required
                      onChange={(e) => setLogistics({ ...logistics, time: e.target.value })}
                      style={{
                        width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.9rem',
                        border: '1.5px solid #E0E0E0', borderRadius: '8px',
                        outline: 'none', boxSizing: 'border-box',
                        fontFamily: 'inherit',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#4A0404'}
                      onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
                    />
                  </div>
                </div>

                {/* Venue — only required for offline events */}
                {selectedEventMode === 'offline' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {selectedEventDetails?.is_festival ? 'Main Event / Inauguration Venue' : 'Venue'} <span style={{ color: '#C62828' }}>*</span>
                    </label>
                    <input
                      type="text" placeholder="e.g., Main Auditorium, Block A" required
                      onChange={(e) => setLogistics({ ...logistics, venue: e.target.value })}
                      style={{
                        width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.9rem',
                        border: '1.5px solid #E0E0E0', borderRadius: '8px',
                        outline: 'none', boxSizing: 'border-box',
                        fontFamily: 'inherit',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#4A0404'}
                      onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
                    />
                  </div>
                ) : (
                  <div style={{ background: '#E3F2FD', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem' }}></span>
                    <span style={{ fontSize: '0.85rem', color: '#1565C0', fontWeight: 500 }}>This is an online event — no venue required.</span>
                  </div>
                )}

                {selectedEventDetails?.is_festival && selectedEventMode === 'offline' && (
                  <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#FAFAFA', borderRadius: '8px', border: '1px solid #E0E0E0' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: theme.colors.maroon }}> Sub-Events Allocation</h4>
                    {logistics.sub_events_logistics.map((sub, idx) => (
                      <div key={idx} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: idx === logistics.sub_events_logistics.length - 1 ? 'none' : '1px solid #EEE' }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>{sub.name}</strong>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#555' }}>Start Time</label>
                            <input type="time" required value={sub.start_time} onChange={(e) => {
                              const newLogistics = [...logistics.sub_events_logistics];
                              newLogistics[idx].start_time = e.target.value;
                              setLogistics({ ...logistics, sub_events_logistics: newLogistics });
                            }} style={{ width: '100%', padding: '0.5rem', border: '1.5px solid #E0E0E0', borderRadius: '6px' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#555' }}>End Time</label>
                            <input type="time" required value={sub.end_time} onChange={(e) => {
                              const newLogistics = [...logistics.sub_events_logistics];
                              newLogistics[idx].end_time = e.target.value;
                              setLogistics({ ...logistics, sub_events_logistics: newLogistics });
                            }} style={{ width: '100%', padding: '0.5rem', border: '1.5px solid #E0E0E0', borderRadius: '6px' }} />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#555' }}>Venue</label>
                          <input type="text" required placeholder="Sub-event Venue" value={sub.venue} onChange={(e) => {
                            const newLogistics = [...logistics.sub_events_logistics];
                            newLogistics[idx].venue = e.target.value;
                            setLogistics({ ...logistics, sub_events_logistics: newLogistics });
                          }} style={{ width: '100%', padding: '0.5rem', border: '1.5px solid #E0E0E0', borderRadius: '6px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Registration Deadline */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Registration Deadline <span style={{ color: '#C62828' }}>*</span>
                  </label>
                  <input
                    type="datetime-local" required
                    onChange={(e) => setLogistics({ ...logistics, registration_deadline: e.target.value })}
                    style={{
                      width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.9rem',
                      border: '1.5px solid #E0E0E0', borderRadius: '8px',
                      outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4A0404'}
                    onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
                  />
                </div>



                {/* Divider */}
                <div style={{ height: '1px', background: '#F0E8E8', margin: '0.25rem 0' }} />

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    style={{
                      flex: 1, padding: '0.7rem', borderRadius: '8px',
                      border: '1.5px solid #E0E0E0', background: '#fff',
                      color: '#555', fontSize: '0.9rem', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 2, padding: '0.7rem', borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #4A0404 0%, #7B1A1A 100%)',
                      color: '#FDD06F', fontSize: '0.9rem', fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 4px 14px rgba(74,4,4,0.3)',
                      transition: 'opacity 0.15s, transform 0.1s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    Upload &amp; Finalize
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    </DashboardLayout>
  );
}

// ── Helper: time-based greeting ────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 4) return 'Evening';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

// ── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    'pending_hod': { bg: '#FFF8E1', color: '#C17F24', label: 'Pending HOD' },
    'pending_director': { bg: '#FFF8E1', color: '#C17F24', label: 'Pending Director' },
    'pending_dean': { bg: '#FFF8E1', color: '#C17F24', label: 'Pending Dean' },
    'pending_provc': { bg: '#FFF8E1', color: '#C17F24', label: 'Pending Pro VC' },
    'pending_vc': { bg: '#FFF8E1', color: '#C17F24', label: 'Pending VC' },
    'pending_approval': { bg: '#FFF8E1', color: '#C17F24', label: 'Pending Approval' },
    'Pending': { bg: '#FFF8E1', color: '#C17F24', label: 'Pending' },
    'approved': { bg: '#E6F4EA', color: '#137333', label: 'Approved' },
    'Approved': { bg: '#E6F4EA', color: '#137333', label: 'Approved' },
    'published': { bg: '#E3F2FD', color: '#1565C0', label: 'Published' },
    'Published': { bg: '#E3F2FD', color: '#1565C0', label: 'Published' },
    'rejected': { bg: '#FCE8E6', color: '#C5221F', label: 'Rejected' },
    'Rejected': { bg: '#FCE8E6', color: '#C5221F', label: 'Rejected' }
  };

  // Default fallback if status is unknown
  const current = map[status] || { bg: '#F1F3F4', color: '#5F6368', label: status || 'Unknown' };

  return (
    <span style={{ backgroundColor: current.bg, color: current.color, padding: '4px 8px', borderRadius: '4px', fontWeight: '500' }}>
      {current.label}
    </span>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = {
  sectionTitle: { fontFamily: theme.fonts.serif, fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '0.3rem' },
  sectionSub: { fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem' },
  root: {
    display: 'flex',
    minHeight: '100vh',
    background: theme.colors.offWhite,
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
  sidebarCollapsed: {
    width: '64px',
  },
  sidebarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0 1.25rem 1rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  sidebarCrest: {
    fontSize: '1.8rem',
    color: theme.colors.gold,
    flexShrink: 0,
  },
  sidebarLogoName: {
    fontFamily: theme.fonts.serif,
    fontSize: '0.95rem',
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.gold,
    lineHeight: 1.1,
  },
  sidebarLogoSub: {
    fontSize: '0.6rem',
    color: 'rgba(253,208,111,0.6)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  divider: {
    height: '1px',
    background: 'rgba(253,208,111,0.15)',
    margin: '0 1.25rem 1rem',
  },
  sidebarNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    padding: '0 0.75rem',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.65rem 0.75rem',
    borderRadius: theme.radii.md,
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.65)',
    transition: theme.transitions.fast,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  navItemActive: {
    background: 'rgba(253,208,111,0.15)',
    color: theme.colors.gold,
    fontWeight: theme.fontWeights.semiBold,
  },
  navIcon: {
    fontSize: '1.1rem',
    flexShrink: 0,
    width: '22px',
    textAlign: 'center',
  },
  navLabel: {
    fontSize: '0.875rem',
  },
  sidebarUserCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.25rem',
    borderTop: '1px solid rgba(253,208,111,0.15)',
    overflow: 'hidden',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: theme.colors.gold,
    color: theme.colors.maroon,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: theme.fontWeights.bold,
    fontSize: '0.9rem',
    flexShrink: 0,
  },
  userInfo: {
    overflow: 'hidden',
  },
  userName: {
    fontSize: '0.8rem',
    fontWeight: theme.fontWeights.semiBold,
    color: theme.colors.white,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: '0.68rem',
    color: 'rgba(253,208,111,0.7)',
    textTransform: 'capitalize',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '0.5rem 0.75rem 0',
    padding: '0.65rem 0.75rem',
    background: 'transparent',
    border: 'none',
    borderRadius: theme.radii.md,
    color: 'rgba(255,255,255,0.55)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: theme.transitions.fast,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    fontFamily: theme.fonts.sansSerif,
  },

  // Main
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },

  // Top bar
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 2rem',
    background: '#ffffff',
    borderBottom: '1px solid #ede9e3',
    boxShadow: theme.shadows.sm,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  collapseBtn: {
    background: 'transparent',
    border: '1px solid #ddd',
    borderRadius: theme.radii.md,
    width: '36px',
    height: '36px',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.colors.maroon,
    flexShrink: 0,
  },
  topBarCenter: {
    flex: 1,
  },
  topBarTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: '1.2rem',
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.charcoal,
    lineHeight: 1.1,
  },
  topBarSub: {
    fontSize: '0.75rem',
    color: theme.colors.midGray,
  },
  topBarUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
  },
  topBarAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: theme.colors.maroon,
    color: theme.colors.gold,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: theme.fontWeights.bold,
    fontSize: '0.95rem',
    flexShrink: 0,
  },
  topBarUserInfo: {},
  topBarUserName: {
    fontSize: '0.85rem',
    fontWeight: theme.fontWeights.semiBold,
    color: theme.colors.charcoal,
  },
  topBarUserRole: {
    fontSize: '0.72rem',
    color: theme.colors.midGray,
  },

  // Scrollable content
  content: {
    padding: 'clamp(1rem, 4vw, 2rem)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
  },

  // Toast
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.25rem',
    borderRadius: theme.radii.lg,
    border: '1px solid',
    animation: 'slideDown 0.3s ease',
  },
  toastSuccess: {
    background: '#E8F5E9',
    borderColor: '#A5D6A7',
    color: '#1B5E20',
  },
  toastError: {
    background: '#FFEBEE',
    borderColor: '#EF9A9A',
    color: '#B71C1C',
  },
  toastIcon: { fontSize: '1.2rem' },
  toastMsg: { flex: 1, fontSize: '0.9rem', fontWeight: 500 },
  toastClose: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    color: 'inherit',
    opacity: 0.6,
    padding: '0 0.25rem',
  },

  // Welcome banner
  welcomeBanner: {
    background: theme.gradients.header,
    borderRadius: theme.radii.xl,
    padding: '2rem 1.5rem',
    minHeight: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  welcomeTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 'clamp(1.2rem, 2vw, 1.8rem)',
    color: theme.colors.white,
    marginBottom: '0.35rem',
    fontWeight: theme.fontWeights.bold,
    lineHeight: '1.4',
  },
  welcomeSub: {
    fontSize: '0.875rem',
    color: 'rgba(255,255,255,0.7)',
    maxWidth: '480px',
    lineHeight: 1.5,
  },
  welcomeDecor: {
    fontSize: '3.5rem',
    opacity: 0.4,
  },
  welcomeIcon: {},

  // Stat cards
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    width: '100%',
    boxSizing: 'border-box',
  },
  statCard: {
    background: 'linear-gradient(135deg, #ffffff 0%, #fdfbf7 100%)',
    borderRadius: theme.radii.xl,
    padding: '1rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
    border: '1px solid #f0ebe1',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default',
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: theme.radii.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statEmoji: { fontSize: '1.4rem' },
  statValue: {
    fontFamily: theme.fonts.serif,
    fontSize: '1.75rem',
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.charcoal,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '0.75rem',
    color: theme.colors.midGray,
    marginTop: '0.25rem',
  },

  // Event request form card
  formCard: {
    background: '#ffffff',
    borderRadius: theme.radii.xl,
    boxShadow: theme.shadows.md,
    border: '1px solid #ede9e3',
    position: 'relative',
    flexShrink: 0,
    padding: '2rem',
  },
  formCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: theme.gradients.header,
  },
  formCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1rem',
    padding: '1.75rem 2rem 0',
  },
  formCardTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: '1.6rem',
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.maroon,
    marginBottom: '0.4rem',
    letterSpacing: '-0.02em',
  },
  formCardSub: {
    fontSize: '0.9rem',
    color: theme.colors.charcoal,
    maxWidth: '520px',
    lineHeight: 1.5,
    opacity: 0.85,
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
    color: '#e65100',
    borderRadius: '24px',
    padding: '0.5rem 1.1rem',
    fontSize: '0.82rem',
    fontWeight: theme.fontWeights.bold,
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(230, 81, 0, 0.15)',
    border: '1px solid rgba(230, 81, 0, 0.3)',
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#C17F24',
    display: 'inline-block',
    animation: 'blink 1.5s ease-in-out infinite',
  },

  // Form fields
  form: {
    display: 'flex', flexDirection: 'column', gap: '2rem'
  },
  formRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', alignItems: 'start' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: '0' },
  formLabel: { fontSize: '0.9rem', fontWeight: '600', color: '#374151' },
  required: { color: '#ef4444', marginLeft: '0.2rem' },
  optional: { color: '#9ca3af', fontWeight: 'normal', fontSize: '0.8rem', marginLeft: '0.5rem' },
  formInput: { border: '1px solid #d1d5db', borderRadius: '10px', padding: '0.8rem 1rem', fontSize: '0.95rem', color: '#1f2937', outline: 'none', background: '#ffffff', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'all 0.2s ease-in-out', boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)' },
  formSelect: {
    cursor: 'pointer',
  },
  formTextarea: {
    resize: 'vertical',
    minHeight: '100px',
  },
  inputError: {
    borderColor: '#C62828',
    background: '#FFF8F8',
  },
  fieldError: {
    fontSize: '0.75rem',
    color: '#C62828',
    marginTop: '0.2rem',
  },
  budgetWrap: {
    display: 'flex',
    position: 'relative',
  },
  budgetPrefix: {
    position: 'absolute',
    left: '0.9rem',
    top: '50%',
    transform: 'translateY(-50%)',
    fontWeight: theme.fontWeights.semiBold,
    color: theme.colors.maroon,
    fontSize: '0.95rem',
    pointerEvents: 'none',
  },
  budgetInput: {
    paddingLeft: '2rem',
  },

  // Submit row
  submitRow: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #f3f4f6' },
  resetBtn: {
    background: 'transparent', border: `1px solid #d1d5db`, borderRadius: '12px', padding: '0.9rem 1.5rem', fontSize: '0.95rem', color: '#374151', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', fontWeight: '500'
  },
  submitBtn: {
    background: theme.colors.maroon, color: theme.colors.gold, border: 'none', borderRadius: '12px', padding: '0.9rem 2.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(128, 0, 0, 0.3)', transition: 'transform 0.1s, box-shadow 0.1s', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'inherit'
  },
  submitBtnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: `2px solid ${theme.colors.gold}`,
    borderTopColor: 'transparent',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.75s linear infinite',
  },

  // Recent submissions table
  recentCard: {
    background: '#ffffff',
    borderRadius: theme.radii.xl,
    padding: '1.75rem 2rem',
    boxShadow: theme.shadows.sm,
    border: '1px solid #ede9e3',
  },
  recentTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: '1.1rem',
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.charcoal,
    marginBottom: '1.25rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '2.5rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  emptyIcon: {
    fontSize: '2.5rem',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '0.9rem',
    color: theme.colors.midGray,
  },
  fetchSpinner: {
    width: '32px',
    height: '32px',
    border: `3px solid ${theme.colors.goldLight}`,
    borderTopColor: theme.colors.maroon,
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.8s linear infinite',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    overflowX: 'auto',
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.85rem 1rem',
    borderBottom: '1px solid #f0ede8',
    minWidth: '600px',
  },
  tableHeader: {
    background: '#FAF8F5',
    borderRadius: `${theme.radii.md} ${theme.radii.md} 0 0`,
    fontWeight: theme.fontWeights.semiBold,
    fontSize: '0.75rem',
    color: theme.colors.midGray,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  tableCell: {
    fontSize: '0.875rem',
    color: theme.colors.darkGray,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  categoryChip: {
    background: theme.colors.goldLight,
    color: '#7a4a00',
    borderRadius: theme.radii.full,
    padding: '0.2rem 0.6rem',
    fontSize: '0.75rem',
    fontWeight: theme.fontWeights.semiBold,
  },
  scaleChip: {
    background: '#E0E7FF',
    color: '#3730A3',
    borderRadius: theme.radii.full,
    padding: '0.2rem 0.6rem',
    fontSize: '0.75rem',
    fontWeight: theme.fontWeights.semiBold,
    textTransform: 'capitalize',
  },
};
