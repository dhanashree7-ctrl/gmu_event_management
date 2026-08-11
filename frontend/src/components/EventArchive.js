import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../config/api';
import theme from '../theme';

const s = (...styles) => Object.assign({}, ...styles.filter(Boolean));

export default function EventArchive({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedYear, setSelectedYear] = useState('All');
  
  // Modal State for Report
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetchArchive = async () => {
      setLoading(true);
      try {
        const url = `${API_BASE}/get_archived_events.php?role=${user?.role}&department=${encodeURIComponent(user?.department_name || '')}`;
        const res = await fetch(url);
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
    if (user) {
      fetchArchive();
    }
  }, [user]);

  // Extract unique academic years for the dropdown
  const academicYears = useMemo(() => {
    const years = new Set(events.map(ev => ev.academic_year));
    return ['All', ...Array.from(years)].sort((a, b) => b.localeCompare(a));
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (selectedYear === 'All') return events;
    return events.filter(ev => ev.academic_year === selectedYear);
  }, [events, selectedYear]);

  const handleReadReport = (ev) => {
    setSelectedReport(ev);
    setReportModalOpen(true);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: theme.colors.midGray }}>
        Loading historical records...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#d32f2f' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: theme.colors.maroon }}>🏛️ Year-Wise Archive</h2>
          <p style={{ margin: '4px 0 0', color: theme.colors.midGray }}>
            Historical record of all successfully completed events.
          </p>
        </div>

        {events.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600, color: '#333' }}>Filter by Academic Year:</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #ccc',
                fontSize: '1rem',
                backgroundColor: '#fff',
                cursor: 'pointer'
              }}
            >
              {academicYears.map(year => (
                <option key={year} value={year}>{year === 'All' ? 'All Years' : year}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {filteredEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1px dashed #CCC' }}>
          <span style={{ fontSize: '3rem' }}>📭</span>
          <p style={{ marginTop: '1rem', color: '#666' }}>No archived events found for this selection.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredEvents.map(ev => (
            <div key={ev.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.academicYearBadge} title="Academic Year">🎓 Year: {ev.academic_year}</span>
                <span style={styles.ratingBadge} title="Student Rating">
                  {ev.average_rating > 0 ? `⭐ ${ev.average_rating}/5 Rating` : 'No Ratings'}
                </span>
              </div>
              <h3 style={styles.cardTitle} title={ev.event_title}>{ev.event_title}</h3>
              <div style={styles.metaInfo}>
                <span title="Event Date">📅 <strong>Date:</strong> {new Date(ev.event_date).toLocaleDateString()}</span>
                <span title="Event Category">🏷️ <strong>Category:</strong> {ev.category}</span>
                <span title="Proposed By">👤 <strong>Organizer:</strong> {ev.proposed_by}</span>
              </div>

              <div style={styles.cardFooter}>
                <button 
                  style={s(styles.btn, (!ev.post_event_report && !ev.report_file_path) && styles.btnDisabled)}
                  onClick={() => handleReadReport(ev)}
                  disabled={!ev.post_event_report && !ev.report_file_path}
                >
                  {(!ev.post_event_report && !ev.report_file_path) ? 'No Report Available' : '📄 Read Report'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && selectedReport && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>Post-Event Report</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                  {selectedReport.event_title}
                </p>
              </div>
              <button style={styles.closeBtn} onClick={() => setReportModalOpen(false)}>✕</button>
            </div>
            
            <div style={styles.modalBody}>
              {selectedReport.post_event_report && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: theme.colors.maroon }}>Written Summary:</h4>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#333', backgroundColor: '#F9F9F9', padding: '1rem', borderRadius: '8px', border: '1px solid #EEE' }}>
                    {selectedReport.post_event_report}
                  </p>
                </div>
              )}

              {selectedReport.report_file_path && (
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: theme.colors.maroon }}>Attached Document:</h4>
                  <a 
                    href={`${API_BASE}/${selectedReport.report_file_path}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block', padding: '0.5rem 1rem', 
                      backgroundColor: theme.colors.info, color: '#fff', 
                      textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold'
                    }}
                  >
                    📥 Download PDF Report
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem'
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    border: '1px solid #E0E0E0',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1rem'
  },
  academicYearBadge: {
    background: '#EDE7F6',
    color: '#512DA8',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    letterSpacing: '0.05em'
  },
  ratingBadge: {
    background: '#FFF8E1',
    color: '#F57F17',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  cardTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.15rem',
    color: theme.colors.maroon,
    lineHeight: 1.3
  },
  metaInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: '#666',
    marginBottom: '1.5rem'
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: '1rem',
    borderTop: '1px solid #EEE'
  },
  btn: {
    width: '100%',
    padding: '0.6rem',
    backgroundColor: '#1565C0',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background 0.2s'
  },
  btnDisabled: {
    backgroundColor: '#CCC',
    color: '#888',
    cursor: 'not-allowed'
  },
  modalOverlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(10,5,5,0.55)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  },
  modalContent: {
    background: '#fff', borderRadius: '12px',
    width: '100%', maxWidth: '600px', maxHeight: '90vh',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 24px 60px rgba(74,4,4,0.22)',
    overflow: 'hidden'
  },
  modalHeader: {
    background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
    padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
    width: '32px', height: '32px', color: '#fff', fontSize: '1.2rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  modalBody: {
    padding: '1.5rem', overflowY: 'auto'
  }
};
