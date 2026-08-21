import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';
import theme from '../theme';

const s = (...styles) => Object.assign({}, ...styles.filter(Boolean));

export default function EventDrillDownPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCollegesModal, setShowCollegesModal] = useState(false);
  const [subEventFilter, setSubEventFilter] = useState('All');
  const [collegeFilter, setCollegeFilter] = useState('All');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_event_drill_down.php?event_id=${eventId}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          alert('Failed to load event details: ' + json.message);
        }
      } catch (err) {
        console.error(err);
        alert('Error loading event details');
      } finally {
        setLoading(false);
      }
    };
    if (eventId) {
      fetchDetails();
    }
  }, [eventId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#666', fontFamily: 'inherit' }}>
        Loading event details...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#666', fontFamily: 'inherit' }}>
        <h2>Event not found</h2>
        <button onClick={() => navigate('/events-admin-dashboard', { state: { activeNav: 'Reports & Analytics' } })} style={styles.backBtn}>Back to Reports</button>
      </div>
    );
  }

  const { master_event, metrics, participants } = data;

  const filteredParticipants = participants.filter(p => {
    if (subEventFilter !== 'All') {
      if (!p.sub_events || !Array.isArray(p.sub_events) || !p.sub_events.includes(subEventFilter)) {
        return false;
      }
    }
    if (collegeFilter !== 'All') {
      if (collegeFilter === 'Internal') {
        if (p.college !== 'GMU') return false;
      } else if (collegeFilter === 'External') {
        if (p.college === 'GMU') return false;
      } else {
        if (p.college !== collegeFilter) return false;
      }
    }
    return true;
  });

  return (
    <div style={styles.pageContainer}>
      <div style={styles.header}>
        <button onClick={() => navigate('/events-admin-dashboard', { state: { activeNav: 'Reports & Analytics' } })} style={styles.backBtn}>← Back to Reports</button>
        <h1 style={styles.title}>{master_event.event_title}</h1>
        <p style={styles.subtitle}>
          <strong>Date:</strong> {master_event.event_date || 'N/A'}
          {master_event.report_file_path && (
            <a 
              href={`${API_BASE}/${master_event.report_file_path}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={s(styles.pdfButton, { marginLeft: '1rem' })}
            >
               View Organizer Report
            </a>
          )}
        </p>
      </div>

      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{metrics.total_participants}</div>
          <div style={styles.metricLabel}>Total Participants</div>
        </div>
        
        <div 
          style={metrics.external_colleges_count > 0 ? s(styles.metricCard, styles.clickableCard) : styles.metricCard}
          onClick={() => metrics.external_colleges_count > 0 && setShowCollegesModal(true)}
        >
          <div style={styles.metricValue}>{metrics.external_colleges_count}</div>
          <div style={styles.metricLabel}>Participating External Colleges</div>
          {metrics.external_colleges_count > 0 && (
            <div style={{ fontSize: '0.8rem', color: theme.colors.maroon, marginTop: '0.5rem', fontWeight: 'bold' }}>
              Click to view colleges
            </div>
          )}
        </div>
        
        <div style={styles.metricCard}>
          <div style={styles.metricValue}>
            {metrics.average_feedback > 0 ? `${metrics.average_feedback} / 5` : 'No Rating'}
          </div>
          <div style={styles.metricLabel}>Average Feedback</div>
        </div>
      </div>

      {metrics.is_festival && metrics.sub_event_breakdown && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Sub-Event Registrations</h3>
          <div style={styles.barChartContainer}>
            {Object.entries(metrics.sub_event_breakdown).map(([subEvent, count], idx) => {
              const maxCount = Math.max(...Object.values(metrics.sub_event_breakdown));
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={idx} style={styles.barRow}>
                  <div style={styles.barLabel}>{subEvent}</div>
                  <div style={styles.barTrack}>
                    <div style={s(styles.barFill, { width: `${percentage}%` })} />
                  </div>
                  <div style={styles.barValue}>{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Participant Demographics Graph */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${theme.colors.gold}`, paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: '#333' }}>Participant Demographics</h3>
          {collegeFilter !== 'All' && (
            <button 
              onClick={() => setCollegeFilter('All')}
              style={{ background: '#eee', color: '#333', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Clear Filter
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '4rem', height: '200px', marginTop: '2rem', borderBottom: '2px solid #ddd', paddingBottom: '0.5rem' }}>
          {/* Internal */}
          <div 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', width: '100px', cursor: 'pointer', opacity: collegeFilter === 'All' || collegeFilter === 'Internal' ? 1 : 0.5, transition: 'opacity 0.2s' }}
            onClick={() => setCollegeFilter('Internal')}
          >
            <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem', color: theme.colors.maroon }}>{metrics.internal_count}</div>
            <div style={{ width: '100%', height: metrics.total_participants > 0 ? `${(metrics.internal_count / metrics.total_participants) * 100}%` : '0%', background: theme.gradients.goldShine, borderRadius: '6px 6px 0 0', transition: 'height 0.5s ease-out' }} />
            <div style={{ marginTop: '0.8rem', fontWeight: 600, color: '#444', textAlign: 'center', fontSize: '0.95rem' }}>GMU</div>
          </div>
          
          {/* External */}
          <div 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', width: '100px', cursor: 'pointer', opacity: collegeFilter === 'All' || collegeFilter === 'External' ? 1 : 0.5, transition: 'opacity 0.2s' }}
            onClick={() => setCollegeFilter('External')}
          >
            <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem', color: theme.colors.maroon }}>{metrics.external_count}</div>
            <div style={{ width: '100%', height: metrics.total_participants > 0 ? `${(metrics.external_count / metrics.total_participants) * 100}%` : '0%', background: '#9fa8da', borderRadius: '6px 6px 0 0', transition: 'height 0.5s ease-out' }} />
            <div style={{ marginTop: '0.8rem', fontWeight: 600, color: '#444', textAlign: 'center', fontSize: '0.95rem' }}>External</div>
          </div>
        </div>

        {/* Detailed breakdown when External is selected */}
        {collegeFilter === 'External' && metrics.external_college_breakdown && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f7fa', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#555', fontSize: '0.95rem', textTransform: 'uppercase' }}>External College Breakdown</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {Object.entries(metrics.external_college_breakdown).map(([cName, count], idx) => (
                <div 
                  key={idx} 
                  onClick={() => setCollegeFilter(cName)}
                  style={{ background: '#fff', padding: '0.8rem', borderRadius: '6px', borderLeft: `3px solid #9fa8da`, cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: '0.9rem', color: '#333' }}>{cName}</span>
                  <span style={{ fontWeight: 'bold', color: theme.colors.maroon }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={styles.splitLayout}>
        <div style={styles.mainContent}>
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${theme.colors.gold}`, paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#333' }}>Participant Roster</h3>
              
              {metrics.is_festival && metrics.sub_event_breakdown && (
                <select 
                  value={subEventFilter} 
                  onChange={(e) => setSubEventFilter(e.target.value)}
                  style={styles.filterDropdown}
                >
                  <option value="All">All Sub-Events</option>
                  {Object.keys(metrics.sub_event_breakdown).map((se, i) => (
                    <option key={i} value={se}>{se}</option>
                  ))}
                </select>
              )}
            </div>
            
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>USN/ID</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Faculty</th>
                    <th style={styles.th}>School</th>
                    <th style={styles.th}>Department</th>
                    <th style={styles.th}>College</th>
                    {metrics.is_festival && <th style={styles.th}>Sub-Events</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants && filteredParticipants.length > 0 ? (
                    filteredParticipants.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={styles.td}>{p.name}</td>
                        <td style={styles.td}>{p.usn}</td>
                        <td style={styles.td}>{p.role}</td>
                        <td style={styles.td}>{p.faculty || '-'}</td>
                        <td style={styles.td}>{p.school || '-'}</td>
                        <td style={styles.td}>{p.department || '-'}</td>
                        <td style={styles.td}>
                          <span style={{
                            background: p.college === 'GMU' ? '#e3f2fd' : '#f3e5f5',
                            color: p.college === 'GMU' ? '#1565c0' : '#7b1fa2',
                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600
                          }}>
                            {p.college === 'GMU' ? 'GMU (Internal)' : p.college}
                          </span>
                        </td>
                        {metrics.is_festival && (
                          <td style={styles.td}>
                            {p.sub_events && p.sub_events.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {p.sub_events.map((se, j) => (
                                  <span key={j} style={styles.subEventBadge}>{se}</span>
                                ))}
                              </div>
                            ) : '-'}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={metrics.is_festival ? 8 : 7} style={{ textAlign: 'center', padding: '1rem', color: '#888' }}>
                        No participants found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={styles.sideContent}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Participant Feedback</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {metrics.feedback_comments && metrics.feedback_comments.length > 0 ? (
                metrics.feedback_comments.map((fb, idx) => (
                  <div key={idx} style={styles.feedbackCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#333' }}>{fb.name}</strong>
                      <span style={{ color: theme.colors.maroon, fontWeight: 'bold' }}> {fb.rating}</span>
                    </div>
                    <p style={{ margin: 0, color: '#555', fontStyle: 'italic', fontSize: '0.95rem' }}>
                      "{fb.comment}"
                    </p>
                  </div>
                ))
              ) : (
                <div style={{ color: '#888', textAlign: 'center', padding: '2rem 0' }}>
                  No feedback comments submitted yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* External Colleges Modal */}
      {showCollegesModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCollegesModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0, color: theme.colors.maroon, fontSize: '1.5rem' }}>External Colleges</h2>
              <button onClick={() => setShowCollegesModal(false)} style={styles.closeBtn}></button>
            </div>
            <ul style={styles.collegesList}>
              {metrics.external_colleges_list.map((college, idx) => (
                <li key={idx} style={styles.collegeListItem}>{college}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  pageContainer: { padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'inherit' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '2.5rem', color: theme.colors.maroon, margin: '1rem 0 0.5rem' },
  subtitle: { color: '#666', fontSize: '1.1rem', margin: 0 },
  backBtn: { background: '#eee', color: '#333', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, transition: '0.2s' },
  pdfButton: { display: 'inline-flex', alignItems: 'center', background: '#fff', color: theme.colors.maroon, border: `1px solid ${theme.colors.maroon}`, padding: '0.4rem 0.8rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', transition: '0.2s' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  metricCard: { background: '#fff', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderBottom: `4px solid ${theme.colors.gold}` },
  metricValue: { fontSize: '2.5rem', fontWeight: 'bold', color: theme.colors.maroon, lineHeight: 1 },
  metricLabel: { marginTop: '0.5rem', fontSize: '1rem', color: '#666', fontWeight: 500 },
  splitLayout: { display: 'flex', gap: '2rem', flexWrap: 'wrap' },
  mainContent: { flex: '2 1 600px' },
  sideContent: { flex: '1 1 350px' },
  card: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '2rem' },
  cardTitle: { margin: '0 0 1.5rem', color: '#333', borderBottom: `2px solid ${theme.colors.gold}`, paddingBottom: '0.5rem' },
  tableResponsive: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' },
  th: { padding: '1rem', background: '#f8f9fa', color: '#444', fontWeight: 600, borderBottom: '2px solid #ddd' },
  td: { padding: '1rem', color: '#555' },
  feedbackCard: { background: '#f9f9f9', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${theme.colors.maroon}` },
  clickableCard: { cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', borderRadius: '16px', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', position: 'relative' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: `2px solid ${theme.colors.gold}`, paddingBottom: '0.5rem' },
  closeBtn: { background: '#eee', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' },
  collegesList: { listStyle: 'none', padding: 0, margin: 0 },
  collegeListItem: { padding: '0.75rem 0', borderBottom: '1px solid #eee', fontSize: '1.05rem', color: '#333' },
  barChartContainer: { display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' },
  barRow: { display: 'flex', alignItems: 'center', gap: '1rem' },
  barLabel: { width: '150px', fontSize: '0.95rem', fontWeight: 600, color: '#444', textAlign: 'right', flexShrink: 0 },
  barTrack: { flexGrow: 1, background: '#eee', height: '24px', borderRadius: '12px', overflow: 'hidden' },
  barFill: { height: '100%', background: theme.gradients.goldShine, transition: 'width 0.5s ease-out', borderRadius: '12px' },
  barValue: { width: '40px', fontSize: '0.95rem', fontWeight: 'bold', color: theme.colors.maroon },
  subEventBadge: { background: theme.colors.goldLight, color: '#333', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, whiteSpace: 'nowrap' },
  filterDropdown: { padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem', outline: 'none', background: '#fff' }
};
