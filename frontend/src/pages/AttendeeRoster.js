import React, { useState, useEffect } from "react";
import { API_BASE } from "../config/api";
import theme from "../theme";

export default function AttendeeRoster({ eventId }) {
  const [attendees, setAttendees] = useState([]);
  const [capacities, setCapacities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) return;
    
    const fetchRoster = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/get_attendee_roster.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: eventId }),
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAttendees(json.data);
          if (json.capacities) setCapacities(json.capacities);
        } else {
          setError(json.message || "Failed to load attendees.");
        }
      } catch (err) {
        setError("Network error while loading roster.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoster();
  }, [eventId]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Attendee Roster</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {['participant','volunteer'].map(r => {
            const cnt = attendees.filter(a => a.registration_role === r).length;
            const icons = { participant: '️', volunteer: '', coordinator: '' };
            const colors = { participant: '#1565C0', volunteer: '#6A1B9A', coordinator: '#2E7D32' };
            const bgs    = { participant: '#E3F2FD', volunteer: '#F3E5F5', coordinator: '#E8F5E9' };
            return cnt > 0 ? (
              <span key={r} style={{ fontSize: '0.78rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '12px', background: bgs[r], color: colors[r] }}>
                {icons[r]} {cnt} {r.charAt(0).toUpperCase() + r.slice(1)}{cnt !== 1 ? 's' : ''}
              </span>
            ) : null;
          })}
          <span style={styles.countBadge}>{attendees.length} Total</span>
        </div>
      </div>
      
      {/* Capacity Overview */}
      {capacities && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem', padding: '1rem', background: '#fcfcfc', border: '1px solid #eee', borderRadius: '8px' }}>
          {['participants', 'volunteers'].map(role => {
            const roleSingular = role.slice(0, -1);
            const limit = capacities[`max_${role}`];
            if (limit === null) return null; // Uncapped
            
            const count = attendees.filter(a => a.registration_role === roleSingular).length;
            const percent = Math.min(100, Math.round((count / limit) * 100));
            
            let color = '#2E7D32'; // Green
            if (percent > 75) color = '#F57C00'; // Orange
            if (percent >= 100) color = '#D32F2F'; // Red

            return (
              <div key={role} style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', textTransform: 'capitalize' }}>{role}</span>
                  <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600 }}>{count} / {limit}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${percent}%`, background: color, transition: 'width 0.3s ease' }} />
                </div>
                {percent >= 100 && (
                  <div style={{ fontSize: '0.7rem', color: '#D32F2F', marginTop: '4px', fontWeight: 600 }}>Capacity Full</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div style={styles.centreState}>
          <div style={styles.spinner} />
          <p style={styles.stateText}>Loading roster...</p>
        </div>
      ) : error ? (
        <div style={styles.centreState}>
          <span style={{ fontSize: "2rem" }}>️</span>
          <p style={styles.stateText}>{error}</p>
        </div>
      ) : attendees.length === 0 ? (
        <div style={styles.centreState}>
          <span style={{ fontSize: "2.5rem" }}></span>
          <p style={styles.stateText}>No one has registered for this event yet.</p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Student Name</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Semester</th>
                <th style={styles.th}>Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map((attendee) => (
                <tr key={attendee.registration_id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.studentInfo}>
                      <span style={styles.studentName}>{attendee.student_name}</span>
                      <span style={styles.studentEmail}>{attendee.usn || attendee.username}</span>
                      {attendee.team_lead && (
                         <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#555', background: '#f5f5f5', padding: '4px 6px', borderRadius: '4px', display: 'inline-block' }}>
                           <strong style={{ color: '#2c3e50' }}>Team Lead:</strong> {attendee.team_lead === attendee.usn ? 'Self (Lead)' : attendee.team_lead}
                         </div>
                      )}
                      {attendee.team_members && (
                         <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#555', background: '#f5f5f5', padding: '4px 6px', borderRadius: '4px' }}>
                           <strong style={{ color: '#2c3e50' }}>Members:</strong> {attendee.team_members}
                         </div>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {(() => {
                      const role = attendee.registration_role || 'participant';
                      const roleStyles = {
                        participant:  { bg: '#E3F2FD', color: '#1565C0', icon: '️' },
                        volunteer:    { bg: '#F3E5F5', color: '#6A1B9A', icon: '' },
                        coordinator:  { bg: '#E8F5E9', color: '#2E7D32', icon: '' },
                      };
                      const rs = roleStyles[role] || roleStyles.participant;
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '10px', background: rs.bg, color: rs.color, fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize' }}>
                          {rs.icon} {role}
                        </span>
                      );
                    })()}
                  </td>
                  <td style={styles.td}>{attendee.semester || "N/A"}</td>
                  <td style={styles.td}>
                    {(() => {
                      const checkedIn = attendee.check_in_status === 'checked_in';
                      const eventDate = attendee.event_date;
                      const isPast = eventDate && new Date(eventDate) < new Date(new Date().toDateString());
                      const isToday = eventDate && new Date(eventDate).toDateString() === new Date().toDateString();

                      if (checkedIn) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ ...styles.statusBadge, ...styles.statusCheckedIn }}>
                               Checked In — Attended
                            </span>
                            {attendee.check_in_time && (
                              <span style={{ fontSize: '0.75rem', color: '#2E7D32', paddingLeft: '2px' }}>
                                 {new Date(attendee.check_in_time).toLocaleTimeString('en-IN', {
                                  hour: '2-digit', minute: '2-digit', hour12: true
                                })}
                              </span>
                            )}
                          </div>
                        );
                      } else if (isPast || isToday) {
                        return (
                          <span style={{ ...styles.statusBadge, background: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2' }}>
                             Not Checked In — Not Attended
                          </span>
                        );
                      } else {
                        return (
                          <span style={{ ...styles.statusBadge, ...styles.statusRegistered }}>
                             Registered — Awaiting Event
                          </span>
                        );
                      }
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: "1.5rem",
    boxShadow: theme.shadows.sm,
    border: "1px solid #E8E2DB",
    marginTop: "1.5rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid #EEE9E2",
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    color: theme.colors.maroon,
    fontWeight: "700",
  },
  countBadge: {
    background: "rgba(253,208,111,0.2)",
    color: theme.colors.maroon,
    padding: "0.25rem 0.75rem",
    borderRadius: theme.radii.full,
    fontSize: "0.85rem",
    fontWeight: "600",
  },
  centreState: {
    padding: "3rem 1rem",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: "30px", height: "30px",
    border: "3px solid rgba(0,0,0,0.1)",
    borderTop: `3px solid ${theme.colors.maroon}`,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  stateText: {
    marginTop: "1rem", color: theme.colors.midGray, fontSize: "0.95rem",
  },
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  thead: {
    background: "#F9F9F9",
  },
  th: {
    padding: "1rem",
    fontSize: "0.85rem",
    fontWeight: "600",
    color: theme.colors.darkGray,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "2px solid #EEE9E2",
  },
  tr: {
    borderBottom: "1px solid #EEE9E2",
  },
  td: {
    padding: "1rem",
    fontSize: "0.95rem",
    color: theme.colors.charcoal,
    verticalAlign: "middle",
  },
  studentInfo: {
    display: "flex",
    flexDirection: "column",
  },
  studentName: {
    fontWeight: "600",
    color: theme.colors.charcoal,
  },
  studentEmail: {
    fontSize: "0.75rem",
    color: theme.colors.midGray,
    marginTop: "0.2rem",
  },
  requirements: {
    fontSize: "0.85rem",
    color: "#D32F2F",
    background: "#FFEBEE",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
  },
  noRequirements: {
    fontSize: "0.85rem",
    color: theme.colors.midGray,
  },
  statusBadge: {
    padding: "0.35rem 0.85rem",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    display: "inline-block",
  },
  statusRegistered: {
    background: "#FFF3E0",
    color: "#E65100",
  },
  statusCheckedIn: {
    background: "#E8F5E9",
    color: "#2E7D32",
  }
};
