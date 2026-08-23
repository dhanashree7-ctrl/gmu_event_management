/**
 * src/pages/StudentAffairsDashboard.js
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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';
import theme from '../theme';
import DashboardMetrics from '../components/DashboardMetrics';
import AttendeeRoster from './AttendeeRoster';
import NotificationView from '../components/NotificationView';
import NotificationBell from '../components/NotificationBell';
import UserProfileDropdown from '../components/UserProfileDropdown';
import SettingsView from '../components/SettingsView';
import ReportsView from '../components/ReportsView';
import DashboardLayout from '../components/layout/DashboardLayout';
import EventArchive from '../components/EventArchive';
import EventCalendar from '../components/EventCalendar';

// ── Utility ─────────────────────────────────────────────────────────────────
const s = (...styles) => Object.assign({}, ...styles);

// ── Constants ───────────────────────────────────────────────────────────────
const CATEGORIES = ['Academic', 'Cultural', 'Sports'];
const SCALES = ['department', 'university'];
const DEPARTMENTS = ['CSE', 'AIML', 'MECH', 'CIVIL', 'ECE'];

const STAT_CARDS = [
  { label: 'Total Submitted', key: 'total', icon: '📋', color: theme.colors.maroon },
  { label: 'Pending Approval', key: 'pending', icon: '⏳', color: '#C17F24' },
  { label: 'Approved', key: 'approved', icon: '✅', color: '#2E7D32' },
  { label: 'Completed', key: 'completed', icon: '🏆', color: '#1565C0' },
];

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '🏠' },
  { label: 'Action Center', icon: '✅' },
  { label: 'Events', icon: '🎫' },
  { label: 'Calendar', icon: '📅' },
  { label: 'Archive', icon: '📦' },
  { label: 'Reports', icon: '📊' },
  { label: 'Notifications', icon: '🔔' },
  { label: 'Settings', icon: '⚙️' },
];



// ── Initial form state ───────────────────────────────────────────────────────
const EMPTY_FORM = {
  event_title: '',
  description: '',
  event_date: '', coordinator_name: '',
  start_time: '',
  end_time: '',
  venue: '',
  category: '',
  event_scale: '',
  event_mode: 'offline',
  date: '', coordinator_name: '',
  involved_departments: [],
  budget: '',
  rewards: '',
  immediate_approval: false,
  brochureFile: null,
  approval_route: [],
  max_participants: '',
  max_volunteers: '',
  max_coordinators: '',
};

// ── Sub-components ───────────────────────────────────────────────────────────

/** Sidebar navigation */
function Sidebar({ user, onLogout, collapsed, activeNav, setActiveNav }) {
  return (
    <aside style={s(styles.sidebar, collapsed && styles.sidebarCollapsed)}>
      {/* Logo */}
      <div style={styles.sidebarLogo}>
        <span style={styles.sidebarCrest}>⚜</span>
        {!collapsed && (
          <div>
            <p style={styles.sidebarLogoName}>GM University</p>
            <p style={styles.sidebarLogoSub}>Event System</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Navigation */}
      <nav style={styles.sidebarNav}>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.label}
            onClick={() => {
              if (item.label === 'Scanner') {
                window.open('/scanner', '_blank');
              } else {
                setActiveNav(item.label);
              }
            }}
            style={s(styles.navItem, activeNav === item.label && styles.navItemActive, { cursor: 'pointer' })}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            {!collapsed && <span style={styles.navLabel}>{item.label}</span>}
          </div>
        ))}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User card */}
      {!collapsed && (
        <div style={styles.sidebarUserCard}>
          <div style={styles.userAvatar}>
            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div style={styles.userInfo}>
            <p style={styles.userName}>{user?.name ?? 'User'}</p>
            <p style={styles.userRole}>
              Faculty
            </p>
          </div>
        </div>
      )}

      {/* Logout */}
      <button onClick={onLogout} style={styles.logoutBtn}>
        <span>🚪</span>
        {!collapsed && <span>Logout</span>}
      </button>
    </aside>
  );
}

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
      <span style={styles.toastIcon}>{isSuccess ? '✅' : '⚠️'}</span>
      <span style={styles.toastMsg}>{message}</span>
      <button onClick={onClose} style={styles.toastClose}>✕</button>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function StudentAffairsDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Layout state
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');

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

  // Loading state for the initial events fetch
  const [fetchLoading, setFetchLoading] = useState(true);

  // State for the logistics form and file upload
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventMode, setSelectedEventMode] = useState('offline');
  const [logistics, setLogistics] = useState({
    date: '', coordinator_name: '',
    time: '',
    venue: '',
    registration_deadline: '',
    max_participants: '',
    max_volunteers: '',
    max_coordinators: ''
  });

  // Roster modal state
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [rosterEventId, setRosterEventId] = useState(null);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportEventId, setReportEventId] = useState(null);
  const [reportSummary, setReportSummary] = useState('');
  const [reportFile, setReportFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [reportSubmitting, setReportSubmitting] = useState(false);

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
    if (logistics.max_volunteers   !== '') formData.append('max_volunteers',   logistics.max_volunteers);
    if (logistics.max_coordinators !== '') formData.append('max_coordinators', logistics.max_coordinators);

    try {
      const res = await fetch(`${API_BASE}/finalize_event.php`, {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      if (json.success) {
        setToast({ type: 'success', message: 'Logistics updated successfully!' });
        setUploadModalOpen(false); // Close the form
        // Update local state to reflect the new 'published' status
        setRecentEvents(prev => prev.map(evt => 
          evt.id === selectedEventId ? { ...evt, status: 'published' } : evt
        ));
      } else {
        alert('Update failed: ' + json.message);
      }
    } catch (err) {
      console.error("Failed to update logistics:", err);
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
    formData.append('faculty_id', user.id);
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
        const res = await fetch(`${API_BASE}/get_my_events.php?user_id=${user.id}`);
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
            involved_departments: evt.involved_departments || [],
            submitted_at: new Date(evt.created_at || Date.now()).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
            }),
          }));

          setRecentEvents(mapped);

          // Compute stat counters from real DB data (case-insensitive to match DB strings)
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

    fetchMyEvents();
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
    if (!form.date) {
      errs.date = 'Event date is required.';
    }
    if (!form.start_time) {
      errs.start_time = 'Start time is required.';
    }
    if (!form.end_time) {
      errs.end_time = 'End time is required.';
    }
    if (form.event_mode === 'offline' && !form.venue.trim()) {
      errs.venue = 'Venue is required for offline events.';
    }
    if (form.budget === '' || isNaN(Number(form.budget)) || Number(form.budget) < 0) {
      errs.budget = 'Enter a valid budget amount (≥ 0).';
    }
    if (!form.brochureFile) {
      errs.brochureFile = 'Please upload a brochure for the proposal.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /** Submits the form to create_event.php */

  // ── Submit handler ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('event_title', form.event_title);
      formData.append('description', form.description);
      formData.append('event_date', form.date);
      formData.append('coordinator_name', form.coordinator_name);
      formData.append('start_time', form.start_time);
      formData.append('end_time', form.end_time);
      formData.append('venue', form.venue);
      formData.append('category', form.category);
      formData.append('event_scale', form.event_scale);
      formData.append('event_mode', form.event_mode);
      formData.append('budget', form.budget);
      formData.append('immediate_approval', form.immediate_approval);
      formData.append('proposed_by_id', user.id);
      formData.append('role', user.role);
      formData.append('brochure', form.brochureFile);
      if (form.max_participants) formData.append('max_participants', form.max_participants);
      if (form.max_volunteers) formData.append('max_volunteers', form.max_volunteers);
      if (form.max_coordinators) formData.append('max_coordinators', form.max_coordinators);

      const res = await fetch(`${API_BASE}/create_event.php`, {
        method: 'POST',
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
          status: 'Pending',
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
        setToast({ type: 'success', message: 'Event request submitted successfully! 🎉' });
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
    <DashboardLayout role="student_affairs" activeNav={activeNav} onNavChange={setActiveNav} onOpenSettings={() => setActiveNav('Settings')}>
      <>
        {toast && (
          <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        )}

        {/* Welcome banner */}
        {activeNav === 'Dashboard' && (
          <div style={styles.welcomeBanner}>
            <div>
              <h2 style={styles.welcomeTitle}>
                Good {getGreeting()}, {user?.name?.split(' ')[0]}
              </h2>
              <p style={styles.welcomeSub}>
                Here is what's happening with student affairs today.
              </p>
            </div>
            <div style={styles.welcomeDecor}></div>
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

          
          {/* Dashboard Metrics — side-by-side grid */}
          {activeNav === 'Dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: recentEvents.length > 0 ? '1fr 1fr' : '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem 1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: '1px solid #f0ebe1' }}>
                <h3 style={{ fontSize: '0.95rem', color: '#6b1519', fontWeight: 700, marginBottom: '0.75rem', marginTop: 0 }}>Event Status Overview</h3>
                <DashboardMetrics 
                  data={[
                    { name: 'Pending', count: stats.pending },
                    { name: 'Approved', count: stats.approved },
                    { name: 'Completed', count: stats.completed }
                  ]} 
                  barName="Total Items"
                  chartType="bar"
                />
              </div>
              {recentEvents.length > 0 && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem 1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: '1px solid #f0ebe1' }}>
                  <h3 style={{ fontSize: '0.95rem', color: '#6b1519', fontWeight: 700, marginBottom: '0.75rem', marginTop: 0 }}>Department Distribution</h3>
                  <DashboardMetrics 
                    data={Object.entries(
                      recentEvents.reduce((acc, ev) => {
                        const cat = ev.category || 'Other';
                        acc[cat] = (acc[cat] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([name, count]) => ({ name, count }))} 
                    type="category" 
                    chartType="pie"
                    pieTitle=""
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Event Request Form ─────────────────────────── */}
          {activeNav === 'New Request' && (
            <div style={styles.formCard}>

            {/* Card header accent */}
            <div style={styles.formCardAccent} />

            <div style={styles.formCardHeader}>
              <div>
                <h2 style={styles.formCardTitle}>📝 New Event Request</h2>
                <p style={styles.formCardSub}>
                  Complete the form below. Your request will be routed for approval automatically.
                </p>
              </div>
              <div style={styles.statusPill}>
                <span style={styles.statusDot} /> Status: Pending on Submit
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
                    {SCALES.map((c) => (
                      <option key={c} value={c} style={{textTransform: 'capitalize'}}>{c}</option>
                    ))}
                  </select>
                  {formErrors.event_scale && (
                    <p style={styles.fieldError}>{formErrors.event_scale}</p>
                  )}
                </div>
              </div>

              {/* Row: Date, Time & Venue */}
              <div style={styles.formRow}>
                <div style={s(styles.formGroup, { flex: 1 })}>
                  <label htmlFor="date" style={styles.formLabel}>
                    Date <span style={styles.required}>*</span>
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => handleFieldChange('date', e.target.value)}
                    style={s(styles.formInput, formErrors.date && styles.inputError)}
                    disabled={loading}
                  />
                  {formErrors.date && (
                    <p style={styles.fieldError}>{formErrors.date}</p>
                  )}
                </div>
                
                <div style={s(styles.formGroup, { flex: 1 })}>
                  <label htmlFor="start_time" style={styles.formLabel}>
                    Start Time <span style={styles.required}>*</span>
                  </label>
                  <input
                    id="start_time"
                    type="time"
                    value={form.start_time}
                    onChange={(e) => handleFieldChange('start_time', e.target.value)}
                    style={s(styles.formInput, formErrors.start_time && styles.inputError)}
                    disabled={loading}
                  />
                  {formErrors.start_time && (
                    <p style={styles.fieldError}>{formErrors.start_time}</p>
                  )}
                </div>

                <div style={s(styles.formGroup, { flex: 1 })}>
                  <label htmlFor="end_time" style={styles.formLabel}>
                    End Time <span style={styles.required}>*</span>
                  </label>
                  <input
                    id="end_time"
                    type="time"
                    value={form.end_time}
                    onChange={(e) => handleFieldChange('end_time', e.target.value)}
                    style={s(styles.formInput, formErrors.end_time && styles.inputError)}
                    disabled={loading}
                  />
                  {formErrors.end_time && (
                    <p style={styles.fieldError}>{formErrors.end_time}</p>
                  )}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="venue" style={styles.formLabel}>
                  Venue {form.event_mode === 'offline' && <span style={styles.required}>*</span>}
                </label>
                <input
                  id="venue"
                  type="text"
                  value={form.venue}
                  onChange={(e) => handleFieldChange('venue', e.target.value)}
                  placeholder="e.g. Main Auditorium"
                  style={s(styles.formInput, formErrors.venue && styles.inputError)}
                  disabled={loading}
                  maxLength={255}
                />
                {formErrors.venue && (
                  <p style={styles.fieldError}>{formErrors.venue}</p>
                )}
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
                      {mode === 'offline' ? '🏢 Offline' : '💻 Online'}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.4rem' }}>
                  {form.event_mode === 'offline'
                    ? 'Venue is required for offline events (set during logistics).'
                    : 'No venue needed — event will be held virtually.'}
                </p>
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

              {/* Description */}
              <div style={styles.formGroup}>
                <label htmlFor="description" style={styles.formLabel}>
                  Description <span style={{color:'red'}}>*</span>
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
                  Proposed Event Date <span style={{ color: 'red' }}>*</span>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
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
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>Max Coordinators</label>
                    <input
                      type="number"
                      min="0"
                      value={form.max_coordinators}
                      onChange={(e) => handleFieldChange('max_coordinators', e.target.value)}
                      placeholder="e.g. 2"
                      style={s(styles.formInput, { padding: '8px' })}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Immediate Approval */}
              <div style={s(styles.formGroup, { marginTop: '1rem' })}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#555', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={form.immediate_approval}
                    onChange={(e) => handleFieldChange('immediate_approval', e.target.checked)}
                    disabled={loading}
                    style={{ width: '18px', height: '18px', accentColor: theme.colors.maroon }}
                  />
                  🚨 Needs Immediate Approval (Urgent)
                </label>
                <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.4rem', marginLeft: '1.8rem' }}>
                  Check this only if the event requires urgent attention (e.g. Independence Day).
                </p>
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
                    '🚀 Submit Event Request'
                  )}
                </button>
              </div>
            </form>
          </div>
          )}

          {/* ── Recent Submissions ────────────────────────── */}
          {activeNav === 'Events' && (
            <div style={styles.recentCard}>
            <h3 style={styles.recentTitle}>📋 My Recent Submissions</h3>

            {fetchLoading ? (
              /* Loading spinner while API call is in-flight */
              <div style={styles.emptyState}>
                <span style={styles.fetchSpinner} />
                <p style={styles.emptyText}>Loading your submissions…</p>
              </div>
            ) : recentEvents.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>🗂️</span>
                <p style={styles.emptyText}>No submissions yet. Use the form above to get started!</p>
              </div>
            ) : (
              <div style={styles.table}>
                {/* Table header */}
                <div style={s(styles.tableRow, styles.tableHeader)}>
                  <span style={s(styles.tableCell, { flex: 2 })}>Event Title</span>
                  <span style={s(styles.tableCell, { flex: 1 })}>Scale</span>
                  <span style={s(styles.tableCell, { flex: 1 })}>Category</span>
                  <span style={s(styles.tableCell, { flex: 1.5 })}>Involved Depts</span>
                  <span style={s(styles.tableCell, { flex: 1 })}>Budget</span>
                  <span style={s(styles.tableCell, { flex: 1 })}>Status</span>
                </div>
                {recentEvents.map((evt) => (
                  <div key={evt.id} style={styles.tableRow}>
                    <span style={s(styles.tableCell, { flex: 2, fontWeight: 500 })}>
                      {evt.event_title}
                    </span>
                    <span style={s(styles.tableCell, { flex: 1 })}>
                      <span style={styles.scaleChip}>{evt.event_scale}</span>
                    </span>
                    <span style={s(styles.tableCell, { flex: 1 })}>
                      <span style={styles.categoryChip}>{evt.category}</span>
                    </span>
                    <span style={s(styles.tableCell, { flex: 1.5 })}>
                      {evt.involved_departments?.length > 0 
                        ? evt.involved_departments.join(', ') 
                        : '—'}
                    </span>
                    <span style={s(styles.tableCell, { flex: 1 })}>
                      ₹{Number(evt.budget).toLocaleString('en-IN')}
                    </span>
                    <span style={s(styles.tableCell, { flex: 1 })}>
                      <StatusBadge status={evt.status} />
                      <button
                        style={{ marginTop: '8px', display: 'block', padding: '5px 10px', backgroundColor: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', width: '100%', fontWeight: '500' }}
                        onClick={() => navigate(`/event-details/${evt.id}`)}
                      >
                        Track Status 🔍
                      </button>
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
                          style={{ marginTop: '8px', display: 'block', padding: '5px 10px', backgroundColor: '#1565C0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', width: '100%' }}
                          onClick={() => {
                            setReportEventId(evt.id);
                            setReportModalOpen(true);
                          }}
                        >
                          Submit Final Report
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {activeNav === 'Notifications' && (
            <NotificationView />
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
                zIndex: 10,
              }}
            >✕</button>
            <div style={{ padding: '1rem' }}>
              <AttendeeRoster eventId={rosterEventId} />
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
            <div style={{
              background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
              padding: '1.5rem 1.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontWeight: 700 }}>
                  📄 Submit Post-Event Report
                </h2>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem' }}>
                  Mark event as completed by providing a summary or uploading a PDF.
                </p>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                  width: '32px', height: '32px', color: '#fff', fontSize: '1.2rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>
            <form onSubmit={handleReportSubmit} style={{ padding: '1.75rem' }}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Written Summary (Optional)</label>
                <textarea
                  style={s(styles.formInput, { minHeight: '100px', resize: 'vertical' })}
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  placeholder="Summarize key highlights..."
                />
              </div>
              <div style={s(styles.formGroup, { marginTop: '1rem' })}>
                <label style={styles.formLabel}>Upload PDF Report (Optional)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setReportFile(e.target.files[0] || null)}
                  style={{
                    padding: '0.5rem', border: '1px dashed #ccc', borderRadius: '8px',
                    background: '#FAFAFA', fontSize: '0.9rem', color: '#555'
                  }}
                />
                <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem' }}>Max size: 5MB</small>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" style={s(styles.resetBtn, { flex: 1 })} onClick={() => setReportModalOpen(false)}>Cancel</button>
                <button type="submit" style={s(styles.submitBtn, reportSubmitting && styles.submitBtnDisabled, { flex: 2, background: '#1565C0' })} disabled={reportSubmitting}>
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
                  🎯 Finalize Event
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
                }}
              >✕</button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleFinalizeEvent} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {/* Date + Time row */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    📅 Event Date
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
                    🕐 Event Time
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
                    📍 Venue <span style={{ color: '#C62828' }}>*</span>
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
                  <span style={{ fontSize: '1.1rem' }}>💻</span>
                  <span style={{ fontSize: '0.85rem', color: '#1565C0', fontWeight: 500 }}>This is an online event — no venue required.</span>
                </div>
              )}

              {/* Registration Deadline */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⏳ Registration Deadline <span style={{ color: '#C62828' }}>*</span>
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
                  🚀 Upload &amp; Finalize
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
  // Map both lowercase and capitalized variations just to be safe!
  const map = {
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
    padding: '2rem',
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
    margin: '0 0 0.5rem',
    fontWeight: 'bold',
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
    background: '#ffffff',
    borderRadius: theme.radii.lg,
    padding: '1.25rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: theme.shadows.sm,
    border: '1px solid #ede9e3',
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
    overflow: 'hidden',
    position: 'relative',
  },
  formCardAccent: {
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
    fontSize: '1.25rem',
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.charcoal,
    marginBottom: '0.3rem',
  },
  formCardSub: {
    fontSize: '0.85rem',
    color: theme.colors.midGray,
    maxWidth: '480px',
    lineHeight: 1.5,
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    background: '#FFF8E1',
    color: '#C17F24',
    borderRadius: theme.radii.full,
    padding: '0.4rem 1rem',
    fontSize: '0.78rem',
    fontWeight: theme.fontWeights.semiBold,
    whiteSpace: 'nowrap',
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
    padding: '1.75rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formRow: {
    display: 'flex',
    gap: '1.25rem',
    flexWrap: 'wrap',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    minWidth: '200px',
  },
  formLabel: {
    fontSize: '0.8rem',
    fontWeight: theme.fontWeights.semiBold,
    color: theme.colors.darkGray,
    letterSpacing: '0.02em',
  },
  required: {
    color: '#C62828',
  },
  optional: {
    color: theme.colors.midGray,
    fontWeight: theme.fontWeights.regular,
  },
  formInput: {
    border: `1px solid #ddd`,
    borderRadius: theme.radii.md,
    padding: '0.7rem 0.9rem',
    fontSize: '0.9rem',
    color: theme.colors.charcoal,
    outline: 'none',
    transition: theme.transitions.fast,
    fontFamily: theme.fonts.sansSerif,
    background: '#FAFAFA',
    width: '100%',
    boxSizing: 'border-box',
  },
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
  submitRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    alignItems: 'center',
    paddingTop: '0.5rem',
    borderTop: '1px solid #f0ede8',
  },
  resetBtn: {
    background: 'transparent',
    border: `1px solid #ddd`,
    borderRadius: theme.radii.full,
    padding: '0.7rem 1.5rem',
    fontSize: '0.9rem',
    color: theme.colors.darkGray,
    cursor: 'pointer',
    transition: theme.transitions.fast,
    fontFamily: theme.fonts.sansSerif,
  },
  submitBtn: {
    background: theme.gradients.header,
    color: theme.colors.gold,
    border: 'none',
    borderRadius: theme.radii.full,
    padding: '0.75rem 2rem',
    fontSize: '0.9rem',
    fontWeight: theme.fontWeights.bold,
    cursor: 'pointer',
    boxShadow: theme.shadows.md,
    transition: theme.transitions.normal,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: theme.fonts.sansSerif,
    letterSpacing: '0.02em',
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
