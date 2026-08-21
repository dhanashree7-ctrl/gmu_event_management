/**
 * src/pages/EventDetails.js
 * -----------------------------------------------------------------
 * Event Details Page with interactive, premium visual timeline
 * showing the proposal's exact journey from HOD/Dean/Director to VC.
 * -----------------------------------------------------------------
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';

export default function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [eventData, setEventData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventAndHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const histRes = await fetch(`${API_BASE}/get_event_history.php?event_id=${eventId}`);
        const histJson = await histRes.json();

        if (histJson.success) {
          setHistory(histJson.data);
          if (histJson.event) {
            setEventData(histJson.event);
          }
        } else {
          throw new Error(histJson.message || "Failed to load timeline history.");
        }

      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load event details.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndHistory();
  }, [eventId, user]);

  const handleBack = () => {
    // Back to appropriate dashboard based on user role
    if (user?.role === 'faculty') {
      navigate('/faculty-dashboard');
    } else if (user?.role === 'hod') {
      navigate('/hod-dashboard');
    } else if (['director', 'dean', 'pro_vc', 'vc', 'provc'].includes(user?.role)) {
      navigate(`/${user.role}-dashboard`);
    } else {
      navigate('/');
    }
  };

  const getStatusColor = (status) => {
    if (!status) return '#666';
    const s = status.toLowerCase();
    if (s.includes('approve') || s === 'published') return theme.colors.success;
    if (s.includes('reject')) return theme.colors.error;
    if (s.includes('pending')) return theme.colors.warning;
    return theme.colors.info;
  };

  const formatStatus = (status) => {
    if (!status) return '';
    return status
      .replace('pending_', 'Pending ')
      .replace('_', ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const renderTimeline = () => {
    if (history.length === 0) {
      return (
        <div style={styles.emptyTimeline}>
          <span style={{ fontSize: '2rem' }}></span>
          <p style={{ marginTop: '10px', color: '#666' }}>No approval steps logged yet. The proposal is awaiting initial department head review.</p>
        </div>
      );
    }

    return (
      <div style={styles.timelineContainer}>
        {history.map((step, idx) => {
          const isLast = idx === history.length - 1;
          const statusColor = getStatusColor(step.action_taken);
          
          return (
            <div key={idx} style={styles.timelineItem}>
              {/* Vertical line connector */}
              {!isLast && <div style={{ ...styles.timelineLine, backgroundColor: '#ddd' }} />}
              
              {/* Timeline marker/node */}
              <div style={{ ...styles.timelineNode, backgroundColor: statusColor, boxShadow: `0 0 0 4px ${statusColor}22` }}>
                {step.action_taken.includes('reject') ? '' : ''}
              </div>

              {/* Timeline content card */}
              <div style={styles.timelineCard}>
                <div style={styles.timelineHeader}>
                  <div>
                    <h4 style={styles.approverName}>{step.approver_name}</h4>
                    <span style={styles.approverRole}>
                      {step.role_name ? step.role_name.toUpperCase() : 'APPROVER'}
                    </span>
                  </div>
                  <span style={styles.timestamp}>
                    {new Date(step.created_at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <div style={styles.timelineBody}>
                  <p style={styles.actionText}>
                    Action: <span style={{ color: statusColor, fontWeight: 'bold' }}>{formatStatus(step.action_taken)}</span>
                  </p>
                  {step.notes && (
                    <div style={styles.notesContainer}>
                      <strong style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>Remarks:</strong>
                      <p style={styles.notesText}>"{step.notes}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Upper Navigation Bar */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={handleBack} style={styles.backBtn}>
            ← Back to Dashboard
          </button>
        </div>
        <div style={styles.headerCenter}>
          <h1 style={styles.headerTitle}>Event Approval Timeline</h1>
        </div>
        <div style={styles.headerRight}>
          {user && (
            <div style={styles.userInfo}>
              <span style={styles.userName}>{user.name}</span>
              <span style={styles.userRoleBadge}>{user.role_name || user.role}</span>
            </div>
          )}
        </div>
      </header>

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p>Loading journey timeline...</p>
        </div>
      ) : error ? (
        <div style={styles.errorContainer}>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button onClick={handleBack} style={styles.actionBtn}>Back to Dashboard</button>
        </div>
      ) : (
        <main style={styles.mainContent}>
          {eventData && (
            <section style={styles.eventSummaryCard}>
              <div style={styles.summaryGrid}>
                <div style={{ flex: 2 }}>
                  <span style={styles.categoryBadge}>{eventData.category}</span>
                  <h2 style={styles.eventTitle}>{eventData.event_title}</h2>
                  <p style={styles.proposerText}>
                    Proposed by: <strong>{eventData.proposed_by || 'Faculty Organizer'}</strong>
                  </p>
                </div>
                <div style={styles.metaColumn}>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Budget Allocation</span>
                    <span style={styles.metaValue}>₹{Number(eventData.budget).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Event Scale</span>
                    <span style={{ ...styles.metaValue, textTransform: 'capitalize' }}>{eventData.event_scale}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Current Status</span>
                    <span style={{ 
                      ...styles.metaValue, 
                      color: getStatusColor(eventData.current_status),
                      fontWeight: 'bold'
                    }}>
                      {formatStatus(eventData.current_status)}
                    </span>
                  </div>
                </div>
              </div>
              
              {eventData.details?.is_festival && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: '#fff9e6',
                  border: `1px solid ${theme.colors.gold}`,
                  borderRadius: '8px'
                }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: theme.colors.maroon, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     Festival Sub-Events
                  </h3>
                  {eventData.details.sub_events_logistics && eventData.details.sub_events_logistics.length > 0 ? (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {eventData.details.sub_events_logistics.map((sub, idx) => (
                        <div key={idx} style={{ background: '#fff', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E0E0E0' }}>
                          <strong style={{ display: 'block', color: theme.colors.charcoal, marginBottom: '0.25rem' }}>{sub.name}</strong>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#555' }}>
                            <span> {sub.venue || 'TBA'}</span>
                            <span> {sub.start_time || 'TBA'} - {sub.end_time || 'TBA'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#555' }}>
                      {eventData.details.sub_events?.map((sub, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{sub}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          )}

          <section style={styles.timelineSection}>
            <h3 style={styles.sectionHeading}>Audit Trail & History</h3>
            {renderTimeline()}
          </section>
        </main>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: theme.colors.offWhite,
    fontFamily: theme.fonts.sansSerif,
    color: theme.colors.charcoal,
  },
  header: {
    background: theme.gradients.header,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    boxShadow: theme.shadows.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 2,
    textAlign: 'center',
  },
  headerRight: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: theme.radii.md,
    cursor: 'pointer',
    fontWeight: '500',
    transition: theme.transitions.fast,
  },
  headerTitle: {
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: '600',
    letterSpacing: '0.5px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  userName: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  userRoleBadge: {
    fontSize: '0.75rem',
    backgroundColor: theme.colors.gold,
    color: theme.colors.maroon,
    padding: '2px 8px',
    borderRadius: '10px',
    marginTop: '2px',
    fontWeight: 'bold',
  },
  mainContent: {
    maxWidth: '900px',
    margin: '2rem auto',
    padding: '0 1rem',
  },
  eventSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: theme.radii.lg,
    padding: '1.5rem 2rem',
    boxShadow: theme.shadows.sm,
    marginBottom: '2rem',
    borderLeft: `5px solid ${theme.colors.maroon}`,
  },
  summaryGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2rem',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: theme.colors.maroon,
    backgroundColor: `${theme.colors.maroon}11`,
    padding: '4px 8px',
    borderRadius: '4px',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
  },
  eventTitle: {
    margin: '0.5rem 0',
    fontSize: '1.6rem',
    color: theme.colors.maroon,
  },
  proposerText: {
    margin: 0,
    color: '#666',
    fontSize: '0.95rem',
  },
  metaColumn: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
    minWidth: '350px',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  metaLabel: {
    fontSize: '0.75rem',
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  metaValue: {
    fontSize: '1rem',
    color: '#333',
    marginTop: '4px',
  },
  timelineSection: {
    backgroundColor: '#fff',
    borderRadius: theme.radii.lg,
    padding: '2rem',
    boxShadow: theme.shadows.sm,
  },
  sectionHeading: {
    margin: '0 0 1.5rem 0',
    color: theme.colors.maroon,
    borderBottom: '1px solid #eee',
    paddingBottom: '0.5rem',
  },
  timelineContainer: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    paddingLeft: '30px',
  },
  timelineItem: {
    position: 'relative',
    marginBottom: '2.5rem',
  },
  timelineLine: {
    position: 'absolute',
    left: '-20px',
    top: '24px',
    bottom: '-34px',
    width: '2px',
  },
  timelineNode: {
    position: 'absolute',
    left: '-30px',
    top: '2px',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 'bold',
    zIndex: 2,
  },
  timelineCard: {
    backgroundColor: '#fdfdfd',
    border: '1px solid #eaeaea',
    borderRadius: theme.radii.md,
    padding: '1.25rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    marginLeft: '10px',
    transition: theme.transitions.fast,
    ':hover': {
      boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
    }
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px dashed #eee',
    paddingBottom: '0.5rem',
    marginBottom: '0.75rem',
  },
  approverName: {
    margin: 0,
    fontSize: '1.05rem',
    color: theme.colors.maroon,
  },
  approverRole: {
    fontSize: '0.7rem',
    color: '#888',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
  },
  timestamp: {
    fontSize: '0.8rem',
    color: '#999',
  },
  timelineBody: {
    fontSize: '0.95rem',
  },
  actionText: {
    margin: '0 0 0.5rem 0',
  },
  notesContainer: {
    backgroundColor: '#f5f5f5',
    padding: '10px',
    borderRadius: theme.radii.sm,
    borderLeft: `3px solid ${theme.colors.maroonLight}`,
    marginTop: '8px',
  },
  notesText: {
    margin: 0,
    fontStyle: 'italic',
    fontSize: '0.9rem',
    color: '#444',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(74,4,4,0.1)',
    borderColor: `${theme.colors.maroon} transparent ${theme.colors.maroon} transparent`,
    borderRadius: '50%',
    animation: 'spin 1.2s linear infinite',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#fff',
    borderRadius: theme.radii.lg,
    maxWidth: '500px',
    margin: '4rem auto',
    boxShadow: theme.shadows.md,
  },
  actionBtn: {
    backgroundColor: theme.colors.maroon,
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: theme.radii.md,
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '1rem',
  },
  emptyTimeline: {
    textAlign: 'center',
    padding: '2rem 1rem',
  }
};
