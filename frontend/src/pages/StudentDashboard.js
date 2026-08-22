/**
 * src/pages/StudentDashboard.js
 * -----------------------------------------------------------------
 * Student portal — shows all published (approved + logistics set)
 * events as a browsable card grid.
 *
 * Layout:
 *   Sidebar (maroon) | Top bar + Welcome banner + Event grid
 *
 * Data flow:
 *   GET /get_published_events.php -> JSON -> event cards
 * -----------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { API_BASE } from "../config/api";
import theme from "../theme";
import StudentEvents from "./StudentEvents";
import SettingsView from "../components/SettingsView";
import NotificationView from '../components/NotificationView';
import EventCalendar from '../components/EventCalendar';
import DashboardMetrics from '../components/DashboardMetrics';
import DashboardLayout from '../components/layout/DashboardLayout';
import EventArchive from '../components/EventArchive';
import ReportsView from '../components/ReportsView';

// ── Utility ──────────────────────────────────────────────────────────────────
const s = (...styles) => Object.assign({}, ...styles);

// ── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "" },
  { id: "registered", label: "Registered Events", icon: "️" },
  { id: "calendar", label: "My Calendar", icon: "" },
  { id: "notifications", label: "Notifications", icon: "" },
  { id: "settings", label: "Settings", icon: "️" },
];

// ── Category colour map ───────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  University: { bg: "#EDE7F6", color: "#512DA8" },
  Academic:    { bg: "#E3F2FD", color: "#1565C0" },
  Department:  { bg: "#FFF8E1", color: "#F57F17" },
  Workshop:    { bg: "#E8F5E9", color: "#2E7D32" },
};

function getCategoryStyle(cat) {
  return CATEGORY_COLORS[cat] ?? { bg: "#F5F5F5", color: "#555" };
}

// ── Helper: format date ───────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "TBD";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ── Helper: format time ───────────────────────────────────────────────────────
function formatTime(timeStr) {
  if (!timeStr) return "TBD";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = ((hour % 12) || 12) + ":" + m;
  return `${display} ${ampm}`;
}

// ── Helper: greeting ─────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

// ── Sub-components ────────────────────────────────────────────────────────────

// ── Main Component ────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("Dashboard");
  const [eventsTab, setEventsTab] = useState("upcoming");
  const [myEvents, setMyEvents] = useState([]);
  const [loadingMyEvents, setLoadingMyEvents] = useState(false);
  const [myEventsError, setMyEventsError] = useState(null);

  const [systemEvents, setSystemEvents] = useState([]);
  const [loadingSystemEvents, setLoadingSystemEvents] = useState(false);
  const [gamificationData, setGamificationData] = useState(null);

  const fetchMyEvents = async () => {
    setLoadingMyEvents(true);
    setMyEventsError(null);
    try {
      const res = await fetch(`${API_BASE}/get_student_events.php?student_id=${user.username}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMyEvents(json.data);
      } else {
        setMyEventsError(json.message || "Could not load your events.");
      }
    } catch (err) {
      console.error("Failed to fetch my events:", err);
      setMyEventsError("Cannot reach the server.");
    } finally {
      setLoadingMyEvents(false);
    }
  };

  const fetchGamificationData = async () => {
    try {
      const res = await fetch(`${API_BASE}/get_student_report_data.php?student_id=${user.username}`);
      const json = await res.json();
      if (json.success) {
        setGamificationData(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch gamification data:", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'Events' || activeTab === 'Calendar' || activeTab === 'Dashboard') {
      fetchMyEvents();
      fetchSystemEvents();
    }
    if (activeTab === 'Dashboard') {
      fetchGamificationData();
    }
  }, [activeTab]);

  // Listen for navigate_tab events from NotificationBell
  useEffect(() => {
    const handler = (e) => setActiveTab(e.detail);
    window.addEventListener('navigate_tab', handler);
    return () => window.removeEventListener('navigate_tab', handler);
  }, []);

  const fetchSystemEvents = async () => {
    setLoadingSystemEvents(true);
    try {
      const res = await fetch(`${API_BASE}/get_archived_events.php?role=student`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSystemEvents(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch system events:", err);
    } finally {
      setLoadingSystemEvents(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const categoryCounts = myEvents.reduce((acc, evt) => {
    const cat = evt.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(categoryCounts).map(([name, count]) => ({ name, count }));

  const roleCounts = myEvents.reduce((acc, evt) => {
    const role = evt.my_role || 'participant';
    const roleName = role === 'volunteer' ? 'Volunteered' : role === 'coordinator' ? 'Coordinated' : 'Participated';
    acc[roleName] = (acc[roleName] || 0) + 1;
    return acc;
  }, {});
  const roleData = Object.entries(roleCounts).map(([name, count]) => ({ name, count }));

  const statusCounts = myEvents.reduce((acc, evt) => {
    const checkedIn = evt.check_in_status === 'checked_in';
    const eventDateStr = evt.event_date || evt.date;
    const isPast = eventDateStr && new Date(eventDateStr) < new Date(new Date().toDateString());
    const isToday = eventDateStr && new Date(eventDateStr).toDateString() === new Date().toDateString();

    if (checkedIn) acc['Attended'] = (acc['Attended'] || 0) + 1;
    else if (isPast || isToday) acc['Missed'] = (acc['Missed'] || 0) + 1;
    else acc['Upcoming'] = (acc['Upcoming'] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([name, count]) => ({ name, count }));

  // Gamification & Context Metrics
  const engagementScore = (statusCounts['Attended'] || 0) * 10 + (statusCounts['Upcoming'] || 0) * 2;
  const goalTarget = 5;
  const attendedCount = statusCounts['Attended'] || 0;
  const goalProgress = Math.min(100, (attendedCount / goalTarget) * 100);

  const systemCategoryCounts = systemEvents.reduce((acc, evt) => {
    const cat = evt.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const trendingCategories = Object.entries(systemCategoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <DashboardLayout role="student" activeNav={activeTab} onNavChange={setActiveTab}>
      <div>
          {/* Welcome banner */}
          {activeTab === 'Dashboard' && (
            <>
              <div style={styles.welcomeBanner}>
                <div>
                  <h2 style={styles.welcomeTitle}>
                    {getGreeting()}, {user?.name?.split(" ")[0] ?? "Charlie"}! 
                  </h2>
                  <p style={styles.welcomeSub}>
                    Browse upcoming events and register for the ones you love.
                  </p>
                </div>
                <div style={styles.welcomeDecor}>
                  <span style={styles.welcomeIcon}></span>
                </div>
              </div>

              {gamificationData && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, marginTop: '1rem' }}>
                  <h3 style={{ fontSize: '1.2rem', color: '#555', marginBottom: '1rem', fontWeight: 600, flexShrink: 0 }}>Your Engagement Overview</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.25rem', flex: 1, minHeight: 0 }}>
                    
                    {/* Reliability Score */}
                    <div style={{ gridColumn: 'span 4', background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0ebe1', display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontSize: '1rem', color: theme.colors.maroon, fontWeight: 'bold', marginBottom: '1rem' }}>Reliability Score</h3>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Attended {gamificationData.reliability.attended} of {gamificationData.reliability.total} Registrations</span>
                          <span style={{ fontSize: '0.85rem', color: theme.colors.maroon, fontWeight: 'bold' }}>{gamificationData.reliability.score}%</span>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: '#E0E0E0', borderRadius: '5px', overflow: 'hidden', marginBottom: '1rem' }}>
                          <div style={{ width: `${gamificationData.reliability.score}%`, height: '100%', background: 'linear-gradient(90deg, #4A0404, #FDD06F)', transition: 'width 1s ease-in-out' }} />
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>Maintain a high reliability score to earn exclusive access to premium events.</p>
                      </div>
                    </div>

                    {/* My Engagement Profile (Radar Chart) */}
                    <div style={{ gridColumn: 'span 4', background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0ebe1', display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontSize: '1rem', color: theme.colors.maroon, fontWeight: 'bold', marginBottom: '0.5rem' }}>My Engagement Profile</h3>
                      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                        {gamificationData.engagement_profile.length > 0 ? (
                          <div style={{ position: 'absolute', inset: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={gamificationData.engagement_profile}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="category" tick={{ fill: '#555', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} />
                                <Radar name="Events" dataKey="count" stroke={theme.colors.maroon} fill={theme.colors.maroon} fillOpacity={0.6} />
                                <Tooltip />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#999', paddingTop: '3rem' }}>Not enough data yet. Register for events!</div>
                        )}
                      </div>
                    </div>

                    {/* Role Breakdown (Donut Chart) */}
                    <div style={{ gridColumn: 'span 4', background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0ebe1', display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontSize: '1rem', color: theme.colors.maroon, fontWeight: 'bold', marginBottom: '0.5rem' }}>Role Breakdown</h3>
                      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                        {gamificationData.role_breakdown.length > 0 ? (
                          <div style={{ position: 'absolute', inset: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={gamificationData.role_breakdown}
                                  cx="50%" cy="50%"
                                  innerRadius="50%" outerRadius="80%"
                                  paddingAngle={5}
                                  dataKey="count"
                                  nameKey="name"
                                >
                                  {gamificationData.role_breakdown.map((entry, index) => {
                                    const colors = [theme.colors.maroon, theme.colors.gold, '#1565C0'];
                                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                  })}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#999', paddingTop: '3rem' }}>Not enough data yet.</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem', flexShrink: 0 }}>
                        {gamificationData.role_breakdown.map((r, i) => (
                          <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#555' }}>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: [theme.colors.maroon, theme.colors.gold, '#1565C0'][i % 3] }}></span>
                            {r.name}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'Events' && (
            <div>
              <h2 style={{ fontSize: "1.4rem", color: theme.colors.maroon, marginBottom: "1.5rem" }}>
                My Schedule
              </h2>
              {loadingMyEvents ? (
                <div style={styles.centreState}>
                  <div style={styles.spinner} />
                  <p style={styles.stateText}>Loading your schedule…</p>
                </div>
              ) : myEventsError ? (
                <div style={styles.centreState}>
                  <span style={{ fontSize: "2.5rem" }}>️</span>
                  <p style={styles.stateText}>{myEventsError}</p>
                </div>
              ) : myEvents.length === 0 ? (
                <div style={styles.centreState}>
                  <span style={{ fontSize: "3rem" }}></span>
                  <p style={styles.stateText}>You haven't registered for any events yet!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={styles.grid}>
                  {myEvents.map((evt) => (
                    <div key={evt.id} style={styles.card}>
                      <div style={styles.cardAccent} />
                      <div style={styles.cardBody}>
                        <h3 style={styles.cardTitle}>{evt.event_title}</h3>
                        <div style={styles.metaRow}>
                          <span style={styles.metaItem}> {evt.venue || 'TBD'}</span>
                          <span style={styles.metaItem}> {formatDate(evt.event_date || evt.date)}</span>
                          <span style={styles.metaItem}> {formatTime(evt.event_time || evt.time)}</span>
                        </div>
                        <div style={{ ...styles.metaRow, marginTop: '0.2rem', paddingTop: '0.4rem', borderTop: '1px dashed #EEE' }}>
                          <span style={styles.metaItem}> Scale: <strong style={{color:'#333', textTransform:'capitalize'}}>{evt.event_scale || 'N/A'}</strong></span>
                          <span style={styles.metaItem}> Cat: <strong style={{color:'#333', textTransform:'capitalize'}}>{evt.category || 'N/A'}</strong></span>
                          <span style={styles.metaItem}> Budget: <strong style={{color:'#333'}}>₹{evt.budget || '0'}</strong></span>
                        </div>
                        {/* Attendance Status Badge */}
                        {(() => {
                          const checkedIn = evt.check_in_status === 'checked_in';
                          const eventDateStr = evt.event_date || evt.date;
                          const isPast = eventDateStr && new Date(eventDateStr) < new Date(new Date().toDateString());
                          const isToday = eventDateStr && new Date(eventDateStr).toDateString() === new Date().toDateString();

                          if (checkedIn) {
                            return (
                              <div style={{
                                marginTop: '0.75rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem'
                              }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                  background: '#E8F5E9', color: '#2E7D32',
                                  borderRadius: '20px', padding: '0.3rem 0.75rem',
                                  fontSize: '0.8rem', fontWeight: 600, width: 'fit-content'
                                }}>
                                   Checked In — Attended
                                </span>
                                {evt.check_in_time && (
                                  <span style={{ fontSize: '0.75rem', color: '#666', paddingLeft: '0.5rem' }}>
                                     Checked in at: {new Date(evt.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                  </span>
                                )}
                              </div>
                            );
                          } else if (isPast || isToday) {
                            return (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                background: '#FFEBEE', color: '#C62828',
                                borderRadius: '20px', padding: '0.3rem 0.75rem',
                                fontSize: '0.8rem', fontWeight: 600, marginTop: '0.75rem', width: 'fit-content'
                              }}>
                                 Not Checked In — Not Attended
                              </span>
                            );
                          } else {
                            return (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                background: '#E3F2FD', color: '#1565C0',
                                borderRadius: '20px', padding: '0.3rem 0.75rem',
                                fontSize: '0.8rem', fontWeight: 600, marginTop: '0.75rem', width: 'fit-content'
                              }}>
                                ️ Registered — Awaiting Event
                              </span>
                            );
                          }
                        })()}
                      </div>
                      {evt.brochure_path && (
                        <div style={styles.cardFooter}>
                          <button
                            style={styles.brochureBtn}
                            onClick={() => {
                              const path = evt.brochure_path.startsWith("uploads/") 
                                ? evt.brochure_path 
                                : `uploads/${evt.brochure_path}`;
                              window.open(`${API_BASE}/${path}`, "_blank");
                            }}
                          >
                             View Brochure
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>
          )}

          {activeTab === 'Calendar' && (
            <div>
              <h2 style={{ fontSize: "1.4rem", color: theme.colors.maroon, marginBottom: "1.5rem" }}>
                My Calendar
              </h2>
              {loadingMyEvents ? (
                <div style={styles.centreState}>
                  <div style={styles.spinner} />
                  <p style={styles.stateText}>Loading your calendar…</p>
                </div>
              ) : myEventsError ? (
                <div style={styles.centreState}>
                  <span style={{ fontSize: "2.5rem" }}>️</span>
                  <p style={styles.stateText}>{myEventsError}</p>
                </div>
              ) : (
                <EventCalendar events={myEvents} />
              )}
            </div>
          )}

          {(activeTab === 'Dashboard') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div style={{ borderTop: '2px solid #EEE', paddingTop: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', color: theme.colors.maroon, marginBottom: '0.5rem', fontWeight: 'bold' }}>Discover New Events</h3>
                <p style={{ color: '#666', marginBottom: '1.5rem' }}>Browse all available university events and secure your spot.</p>
                <StudentEvents />
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <NotificationView />
          )}

          {activeTab === 'Settings' && <SettingsView user={user} />}

          {activeTab === 'Archive' && (
            <div>
              <h2 style={{ fontSize: '1.4rem', color: theme.colors.maroon, marginBottom: '1.5rem' }}>
                Archive
              </h2>
              <EventArchive user={user} />
            </div>
          )}

          {activeTab === 'Reports' && (
            <div>
              <ReportsView user={user} />
            </div>
          )}
        </div>
    </DashboardLayout>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
    background: theme.colors.offWhite,
    fontFamily: theme.fonts.sansSerif,
  },

  // ── Sidebar ───────────────────────────────────────────────────────
  sidebar: {
    width: "240px",
    minHeight: "100vh",
    background: theme.gradients.header,
    display: "flex",
    flexDirection: "column",
    padding: "1.5rem 0",
    transition: "width 0.25s ease",
    flexShrink: 0,
    position: "sticky",
    top: 0,
    overflowX: "hidden",
  },
  sidebarCollapsed: { width: "64px" },
  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0 1.25rem 1rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  sidebarCrest: { fontSize: "1.8rem", color: theme.colors.gold, flexShrink: 0 },
  sidebarLogoName: {
    fontFamily: theme.fonts.serif,
    fontSize: "0.95rem",
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.gold,
    lineHeight: 1.1,
  },
  sidebarLogoSub: {
    fontSize: "0.6rem",
    color: "rgba(253,208,111,0.6)",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  divider: {
    height: "1px",
    background: "rgba(253,208,111,0.15)",
    margin: "0 1.25rem 1rem",
  },
  sidebarNav: { display: "flex", flexDirection: "column", gap: "0.2rem", padding: "0 0.75rem" },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.85rem",
    padding: "0.65rem 0.75rem",
    borderRadius: theme.radii.md,
    cursor: "pointer",
    color: "rgba(255,255,255,0.65)",
    transition: theme.transitions.fast,
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  navItemActive: {
    background: "rgba(253,208,111,0.15)",
    color: theme.colors.gold,
    fontWeight: theme.fontWeights.semiBold,
  },
  navIcon: { fontSize: "1.1rem", flexShrink: 0, width: "22px", textAlign: "center" },
  navLabel: { fontSize: "0.875rem" },
  sidebarUserCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "1rem 1.25rem",
    borderTop: "1px solid rgba(253,208,111,0.15)",
    overflow: "hidden",
  },
  userAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: theme.colors.gold,
    color: theme.colors.maroon,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: theme.fontWeights.bold,
    fontSize: "0.9rem",
    flexShrink: 0,
  },
  userInfo: { overflow: "hidden" },
  userName: {
    fontSize: "0.875rem",
    fontWeight: theme.fontWeights.semiBold,
    color: theme.colors.white,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userRole: { fontSize: "0.72rem", color: "rgba(253,208,111,0.7)", textTransform: "capitalize" },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    margin: "0.5rem 0.75rem 0",
    padding: "0.6rem 0.75rem",
    borderRadius: theme.radii.md,
    border: "none",
    background: "rgba(255,80,80,0.1)",
    color: "rgba(255,160,160,0.9)",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: theme.transitions.fast,
    whiteSpace: "nowrap",
    overflow: "hidden",
  },

  // ── Top bar ───────────────────────────────────────────────────────
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.85rem 2rem",
    background: theme.colors.white,
    borderBottom: "1px solid #EEE9E2",
    boxShadow: theme.shadows.sm,
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  collapseBtn: {
    background: "none",
    border: "1px solid #DDD",
    borderRadius: theme.radii.md,
    width: "36px",
    height: "36px",
    cursor: "pointer",
    fontSize: "1rem",
    flexShrink: 0,
    color: theme.colors.darkGray,
  },
  topBarCenter: { flex: 1 },
  topBarTitle: {
    fontSize: "1.1rem",
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.maroon,
    margin: 0,
  },
  topBarSub: { fontSize: "0.75rem", color: theme.colors.midGray, margin: "2px 0 0" },
  topBarUser: { display: "flex", alignItems: "center", gap: "0.6rem" },
  topBarAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: theme.gradients.header,
    color: theme.colors.gold,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: theme.fontWeights.bold,
    fontSize: "1rem",
  },
  topBarUserInfo: {},
  topBarUserName: {
    fontSize: "0.875rem",
    fontWeight: theme.fontWeights.semiBold,
    color: theme.colors.charcoal,
    margin: 0,
  },
  topBarUserRole: { fontSize: "0.72rem", color: theme.colors.midGray, margin: 0 },

  // ── Content ───────────────────────────────────────────────────────
  content: { flex: 1, padding: "2rem", overflowY: "auto" },

  welcomeBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: theme.gradients.header,
    borderRadius: theme.radii.xl,
    padding: "2rem 2.5rem",
    marginBottom: "2rem",
    boxShadow: theme.shadows.lg,
    overflow: "hidden",
    position: "relative",
  },
  welcomeTitle: {
    fontSize: "1.6rem",
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.white,
    margin: "0 0 0.4rem",
  },
  welcomeSub: { color: "rgba(255,255,255,0.72)", fontSize: "0.9rem", margin: 0 },
  welcomeDecor: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "rgba(253,208,111,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  welcomeIcon: { fontSize: "2.2rem" },

  // ── Toolbar (search + filter) ─────────────────────────────────────
  toolbar: {
    display: "flex",
    flexDirection: "column",
    gap: "0.85rem",
    marginBottom: "1.75rem",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    background: theme.colors.white,
    border: "1.5px solid #E8E2DB",
    borderRadius: theme.radii.lg,
    padding: "0 1rem",
    boxShadow: theme.shadows.sm,
    maxWidth: "480px",
  },
  searchIcon: { fontSize: "1rem", marginRight: "0.5rem", color: theme.colors.midGray },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "0.65rem 0",
    fontSize: "0.9rem",
    color: theme.colors.charcoal,
    background: "transparent",
    fontFamily: "inherit",
  },
  filterRow: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  filterBtn: {
    padding: "0.4rem 1rem",
    borderRadius: theme.radii.full,
    border: "1.5px solid #DDD",
    background: theme.colors.white,
    color: theme.colors.darkGray,
    fontSize: "0.82rem",
    fontWeight: theme.fontWeights.medium,
    cursor: "pointer",
    transition: theme.transitions.fast,
    fontFamily: "inherit",
  },
  filterBtnActive: {
    background: theme.colors.maroon,
    borderColor: theme.colors.maroon,
    color: theme.colors.gold,
    fontWeight: theme.fontWeights.semiBold,
  },

  resultCount: {
    fontSize: "0.82rem",
    color: theme.colors.midGray,
    marginBottom: "1rem",
  },

  // ── Event grid ────────────────────────────────────────────────────
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
    alignItems: "flex-start",
  },

  // ── Event card ────────────────────────────────────────────────────
  card: {
    background: theme.colors.white,
    borderRadius: theme.radii.lg,
    boxShadow: theme.shadows.sm,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    transition: "box-shadow 0.2s ease, transform 0.2s ease",
    border: "1px solid #EEE9E2",
  },
  cardHovered: {
    boxShadow: theme.shadows.lg,
    transform: "translateY(-3px)",
  },
  cardAccent: {
    height: "5px",
    background: theme.gradients.header,
  },
  cardBody: { padding: "1.25rem", flex: 1 },
  categoryChip: {
    display: "inline-block",
    padding: "0.2rem 0.65rem",
    borderRadius: theme.radii.full,
    fontSize: "0.72rem",
    fontWeight: theme.fontWeights.semiBold,
    marginBottom: "0.65rem",
  },
  cardTitle: {
    fontSize: "1rem",
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.charcoal,
    margin: "0 0 0.5rem",
    lineHeight: 1.35,
  },
  cardDesc: {
    fontSize: "0.82rem",
    color: theme.colors.darkGray,
    margin: "0 0 1rem",
    lineHeight: 1.5,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  metaRow: { display: "flex", flexDirection: "column", gap: "0.3rem", marginTop: "0.5rem" },
  metaItem: { fontSize: "0.8rem", color: theme.colors.darkGray },

  // ── Card footer ───────────────────────────────────────────────────
  cardFooter: {
    display: "flex",
    gap: "0.5rem",
    padding: "0.85rem 1.25rem",
    borderTop: "1px solid #F0EDE8",
    background: "#FDFBF8",
  },
  brochureBtn: {
    flex: 1,
    padding: "0.55rem",
    borderRadius: theme.radii.md,
    border: "1.5px solid #DDD",
    background: "transparent",
    color: theme.colors.darkGray,
    fontSize: "0.8rem",
    fontWeight: theme.fontWeights.medium,
    cursor: "pointer",
    transition: theme.transitions.fast,
    fontFamily: "inherit",
  },
  registerBtn: {
    flex: 2,
    padding: "0.55rem",
    borderRadius: theme.radii.md,
    border: "none",
    background: theme.colors.maroon,
    color: theme.colors.gold,
    fontSize: "0.85rem",
    fontWeight: theme.fontWeights.bold,
    cursor: "pointer",
    transition: "background 0.15s ease, transform 0.15s ease",
    boxShadow: "0 3px 10px rgba(74,4,4,0.22)",
    fontFamily: "inherit",
  },

  // ── Empty / loading states ────────────────────────────────────────
  centreState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    padding: "5rem 2rem",
    color: theme.colors.midGray,
  },
  stateText: { fontSize: "0.95rem", textAlign: "center", maxWidth: "320px" },
  spinner: {
    width: "36px",
    height: "36px",
    border: `3px solid ${theme.colors.lightGray}`,
    borderTop: `3px solid ${theme.colors.maroon}`,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};
