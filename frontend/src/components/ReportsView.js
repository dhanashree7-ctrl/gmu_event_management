import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { API_BASE } from '../config/api';
import theme from '../theme';
import DashboardMetrics from './DashboardMetrics';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const s = (...styles) => Object.assign({}, ...styles.filter(Boolean));

export default function ReportsView({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [facultyReports, setFacultyReports] = useState(null);
  const [hodReports, setHodReports] = useState(null);
  const [execReports, setExecReports] = useState(null);

  useEffect(() => {
    const fetchArchive = async () => {
      setLoading(true);
      try {
        const url = `${API_BASE}/get_archived_events.php?role=${user?.role}&department=${encodeURIComponent(user?.department_name || '')}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) {
          // If faculty, optionally filter to just their events, or show all. 
          // For Reports, we will show all completed events for analytics.
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

    const fetchFacultyReports = async () => {
      try {
        const url = `${API_BASE}/get_faculty_report_data.php?user_id=${user?.id}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) setFacultyReports(json.data);
      } catch (err) {
        console.error('Failed to fetch faculty reports', err);
      }
    };

    const fetchHodReports = async () => {
      try {
        const url = `${API_BASE}/get_hod_report_data.php?department=${encodeURIComponent(user?.department_name || '')}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) setHodReports(json.data);
      } catch (err) {
        console.error('Failed to fetch hod reports', err);
      }
    };

    const fetchExecReports = async () => {
      try {
        const url = `${API_BASE}/get_executive_report_data.php`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) setExecReports(json.data);
      } catch (err) {
        console.error('Failed to fetch exec reports', err);
      }
    };

    if (user) {
      fetchArchive();
      if (user.role === 'faculty') fetchFacultyReports();
      if (user.role === 'hod') fetchHodReports();
      if (['director', 'dean', 'pro_vc', 'provc', 'vc', 'executive'].includes(user.role)) fetchExecReports();
    }
  }, [user]);

  const metrics = useMemo(() => {
    const total = events.length;
    let avgRating = 0;
    let totalRatings = 0;
    const categoryCount = {};

    events.forEach(ev => {
      if (ev.average_rating > 0) {
        avgRating += ev.average_rating;
        totalRatings++;
      }
      
      const cat = ev.category || 'Other';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    if (totalRatings > 0) {
      avgRating = (avgRating / totalRatings).toFixed(1);
    }

    return { total, avgRating, categoryCount };
  }, [events]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: theme.colors.midGray }}>
        Generating Reports...
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

  // Determine top 5 events for charts to avoid overcrowding
  const topEvents = [...events].sort((a, b) => b.total_participants - a.total_participants).slice(0, 5);

  const participationData = topEvents.map(e => ({
    name: e.event_title.length > 20 ? e.event_title.substring(0, 17) + '...' : e.event_title,
    count: parseInt(e.total_participants || 0)
  }));

  const topFeedbackEvents = [...events].sort((a, b) => b.average_rating - a.average_rating).slice(0, 5);
  
  const feedbackData = topFeedbackEvents.map(e => ({
    name: e.event_title.length > 20 ? e.event_title.substring(0, 17) + '...' : e.event_title,
    count: parseFloat(e.average_rating || 0)
  }));

  const handleExportExcel = () => {
    if (!events.length) return alert('No data to export');
    const ws = XLSX.utils.json_to_sheet(events.map(e => ({
      'Event Name': e.event_title,
      'Date': e.event_date ? new Date(e.event_date).toLocaleDateString() : 'N/A',
      'Category': e.category,
      'Average Rating': e.average_rating > 0 ? e.average_rating : 'No ratings'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Completed Events");
    XLSX.writeFile(wb, `Reports_${new Date().getTime()}.xlsx`);
  };

  const handleExportPDF = async () => {
    if (!events.length) return alert('No data to export');
    
    // Fallback if not browser environment
    if (typeof window === 'undefined') return;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const reportElement = document.getElementById('reports-container-for-pdf');
      
      if (reportElement) {
        // Show a brief loading indicator (optional, but good UX)
        const btn = document.activeElement;
        const oldText = btn.innerText;
        if (btn) btn.innerText = 'Generating...';
        
        const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        
        let doc = new jsPDF('p', 'mm', 'a4');
        
        doc.setFontSize(22);
        doc.setTextColor(107, 21, 25);
        doc.text("Event Analytics & Reports", 14, 25);
        
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', 0, 35, pdfWidth, pdfHeight);
        
        // Next page for the raw data table
        doc.addPage();
        doc.setFontSize(16);
        doc.text("Raw Event Data", 14, 20);
        
        const tableColumn = ["Event Name", "Date", "Category", "Rating"];
        const tableRows = events.map(e => [
          e.event_title, 
          e.event_date ? new Date(e.event_date).toLocaleDateString() : 'N/A', 
          e.category, 
          e.average_rating > 0 ? e.average_rating : 'No ratings'
        ]);
        
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 30,
        });
        
        doc.save(`Reports_${new Date().getTime()}.pdf`);
        
        if (btn) btn.innerText = oldText;
      }
    } catch (err) {
      console.error('Failed to export PDF with charts:', err);
      alert('Failed to generate full report. Check console for details.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}> Analytics & Reports</h2>
          <p style={styles.subtitle}>Insights and event reports for completed events.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleExportExcel} style={{ padding: '0.5rem 1rem', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
             Export Excel
          </button>
          <button onClick={handleExportPDF} style={{ padding: '0.5rem 1rem', background: '#D32F2F', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
             Export PDF
          </button>
        </div>
      </div>

      <div id="reports-container-for-pdf">
      {user?.role === 'faculty' && facultyReports && (
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={styles.sectionTitle}>My Faculty Insights</h3>
          
          <div style={styles.metricsRow}>
             <div style={styles.metricCard}>
              <div style={s(styles.metricIcon, { background: 'rgba(74,4,4,0.1)', color: theme.colors.maroon })}></div>
              <div>
                <div style={styles.metricValue}>{facultyReports.check_in_funnel.registered}</div>
                <div style={styles.metricLabel}>Total Registered</div>
              </div>
            </div>
             <div style={styles.metricCard}>
              <div style={s(styles.metricIcon, { background: 'rgba(46, 125, 50, 0.1)', color: '#2E7D32' })}></div>
              <div>
                <div style={styles.metricValue}>{facultyReports.check_in_funnel.checked_in}</div>
                <div style={styles.metricLabel}>Total Checked-In</div>
              </div>
            </div>
             <div style={styles.metricCard}>
              <div style={s(styles.metricIcon, { background: 'rgba(253,208,111,0.2)', color: '#C17F24' })}></div>
              <div>
                <div style={styles.metricValue}>{facultyReports.average_score} / 5</div>
                <div style={styles.metricLabel}>Avg Feedback ({facultyReports.total_feedbacks} ratings)</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
            {/* Check-In Funnel */}
            <div style={styles.chartSection}>
              <h4 style={{ marginTop: 0, color: '#333' }}>Check-In Funnel</h4>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={[
                    { name: 'Registered', count: facultyReports.check_in_funnel.registered },
                    { name: 'Checked-In', count: facultyReports.check_in_funnel.checked_in }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill={theme.colors.maroon} radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
              {/* Demographics Donut */}
              <div style={styles.chartSection}>
                <h4 style={{ marginTop: 0, color: '#333' }}>Participant Demographics</h4>
                <div style={{ width: '100%', height: 300 }}>
                  {facultyReports.demographics.length > 0 ? (
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={facultyReports.demographics}
                          cx="50%" cy="50%"
                          innerRadius="50%" outerRadius="80%"
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="department"
                        >
                          {facultyReports.demographics.map((entry, index) => {
                            const colors = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Pie>
                        <RechartsTooltip />
                        <Legend 
                          verticalAlign="bottom" 
                          iconType="circle"
                          wrapperStyle={{ paddingTop: '20px', maxHeight: '100px', overflowY: 'auto', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#888', paddingTop: '2rem' }}>No demographic data available.</div>
                  )}
                </div>
              </div>

              {/* Feedback Histogram */}
              <div style={styles.chartSection}>
                <h4 style={{ marginTop: 0, color: '#333' }}>Feedback Distribution</h4>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={[
                      { rating: '1 Star', count: facultyReports.feedback_distribution['1'] },
                      { rating: '2 Stars', count: facultyReports.feedback_distribution['2'] },
                      { rating: '3 Stars', count: facultyReports.feedback_distribution['3'] },
                      { rating: '4 Stars', count: facultyReports.feedback_distribution['4'] },
                      { rating: '5 Stars', count: facultyReports.feedback_distribution['5'] }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="rating" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="count" fill={theme.colors.gold} radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'hod' && hodReports && (
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={styles.sectionTitle}>{user?.department_name || 'Department'} Insights</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            {/* Departmental Event Output */}
            <div style={styles.chartSection}>
              <h4 style={{ marginTop: 0, color: '#333' }}>Event Output</h4>
              <div style={{ width: '100%', height: 300 }}>
                {hodReports.event_output.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={hodReports.event_output}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill={theme.colors.maroon} radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#888', paddingTop: '2rem' }}>No events organized yet.</div>
                )}
              </div>
            </div>

            {/* Student Engagement Index */}
            <div style={styles.chartSection}>
              <h4 style={{ marginTop: 0, color: '#333' }}>Student Engagement Index</h4>
              <div style={{ width: '100%', height: 300 }}>
                {hodReports.student_engagement.length > 0 ? (
                  <ResponsiveContainer>
                    <LineChart data={hodReports.student_engagement}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="count" stroke={theme.colors.gold} strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#888', paddingTop: '2rem' }}>No student engagement data yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Faculty Leaderboard */}
          <div style={s(styles.tableSection, { marginTop: '2rem' })}>
            <h4 style={{ marginTop: 0, color: '#333' }}>Faculty Leaderboard</h4>
            {hodReports.faculty_leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', padding: '1rem' }}>No faculty activity yet.</div>
            ) : (
              <div style={styles.tableWrap}>
                <div style={s(styles.tableRow, styles.tableHeader)}>
                  <div style={{ flex: 2 }}>Faculty Name</div>
                  <div style={{ flex: 1, textAlign: 'center' }}>Events Hosted</div>
                  <div style={{ flex: 1, textAlign: 'center' }}>Avg Feedback</div>
                </div>
                {hodReports.faculty_leaderboard.map((fac, idx) => (
                  <div key={idx} style={styles.tableRow}>
                    <div style={{ flex: 2, fontWeight: 500, color: '#333' }}>
                      {idx === 0 ? ' ' : idx === 1 ? ' ' : idx === 2 ? ' ' : ''}{fac.faculty_name}
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', color: '#555' }}>{fac.total_events}</div>
                    <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', color: fac.average_rating >= 4 ? '#2E7D32' : '#C17F24' }}>
                      {fac.average_rating > 0 ? `${fac.average_rating} ` : '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {['director', 'dean', 'pro_vc', 'provc', 'vc', 'executive'].includes(user?.role) && execReports && (
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={styles.sectionTitle}>Global Executive Insights</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            {/* Faculty/School Comparison */}
            <div style={s(styles.chartSection, { gridColumn: '1 / -1' })}>
              <h4 style={{ marginTop: 0, color: '#333' }}>Faculty Output Comparison</h4>
              <div style={{ width: '100%', height: 400 }}>
                {execReports.faculty_comparison.data.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={execReports.faculty_comparison.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="school_name" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                      <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
                      {execReports.faculty_comparison.faculties.map((fac, idx) => {
                         const colors = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
                         return <Bar key={fac} dataKey={fac} stackId="a" fill={colors[idx % colors.length]} />;
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#888', paddingTop: '2rem' }}>No data available.</div>
                )}
              </div>
            </div>

            {/* Budget vs Scale */}
            <div style={styles.chartSection}>
              <h4 style={{ marginTop: 0, color: '#333' }}>ROI: Budget vs Scale</h4>
              <div style={{ width: '100%', height: 350 }}>
                {execReports.budget_vs_scale.length > 0 ? (
                  <ResponsiveContainer>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="checked_in" name="Checked-in" label={{ value: 'Checked-in Participants', position: 'bottom', offset: 0 }} />
                      <YAxis type="number" dataKey="budget" name="Budget" label={{ value: 'Budget (₹)', angle: -90, position: 'insideLeft' }} />
                      <ZAxis type="category" dataKey="event_name" name="Event" />
                      <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Events" data={execReports.budget_vs_scale} fill={theme.colors.gold} />
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#888', paddingTop: '2rem' }}>No budget/scale data available.</div>
                )}
              </div>
            </div>

            {/* Internal vs External */}
            <div style={styles.chartSection}>
              <h4 style={{ marginTop: 0, color: '#333' }}>Internal vs External Reach</h4>
              <div style={{ width: '100%', height: 350 }}>
                {execReports.reach.some(r => r.count > 0) ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={execReports.reach}
                        cx="50%" cy="50%"
                        innerRadius="0%" outerRadius="80%"
                        dataKey="count"
                        nameKey="name"
                      >
                        <Cell key="internal" fill={theme.colors.maroon} />
                        <Cell key="external" fill={theme.colors.gold} />
                      </Pie>
                      <RechartsTooltip />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#888', paddingTop: '2rem' }}>No reach data available.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Level Metrics */}
      <div style={styles.metricsRow}>
        <div style={styles.metricCard}>
          <div style={s(styles.metricIcon, { background: 'rgba(74,4,4,0.1)', color: theme.colors.maroon })}></div>
          <div>
            <div style={styles.metricValue}>{metrics.total}</div>
            <div style={styles.metricLabel}>Completed Events</div>
          </div>
        </div>
        <div style={styles.metricCard}>
          <div style={s(styles.metricIcon, { background: 'rgba(253,208,111,0.2)', color: '#C17F24' })}></div>
          <div>
            <div style={styles.metricValue}>{metrics.avgRating} / 5</div>
            <div style={styles.metricLabel}>Average Feedback Score</div>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2rem' }}>
        <DashboardMetrics 
          data={participationData} 
          type="category" 
          barName="Participants"
          title="Top Events by Participation"
          pieTitle="Participation Share (Top 5)"
        />
        <DashboardMetrics 
          data={feedbackData} 
          type="category" 
          barName="Average Rating"
          title="Highest Rated Events"
          pieTitle="Rating Share (Top 5)"
        />
      </div>

      {/* Data Table */}
      <div style={styles.tableSection}>
        <h3 style={styles.sectionTitle}>Detailed Reports</h3>
        
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: theme.colors.midGray }}>
            No completed events to report on.
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <div style={s(styles.tableRow, styles.tableHeader)}>
              <div style={{ flex: 2 }}>Event Name</div>
              <div style={{ flex: 1 }}>Date</div>
              <div style={{ flex: 1 }}>Category</div>
              <div style={{ flex: 1, textAlign: 'center' }}>Rating</div>
              <div style={{ flex: 1.5, textAlign: 'center' }}>Action</div>
            </div>
            {events.map(ev => (
              <div key={ev.id} style={styles.tableRow}>
                <div style={{ flex: 2, fontWeight: 500, color: '#333' }}>{ev.event_title}</div>
                <div style={{ flex: 1, fontSize: '0.9rem', color: '#666' }}>
                  {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : 'N/A'}
                </div>
                <div style={{ flex: 1, fontSize: '0.9rem' }}>{ev.category}</div>
                <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', color: ev.average_rating >= 4 ? '#2E7D32' : '#C17F24' }}>
                  {ev.average_rating > 0 ? `${ev.average_rating} ` : 'No ratings'}
                </div>
                <div style={{ flex: 1.5, display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  {ev.post_event_report || ev.report_file_path ? (
                    <button 
                      style={styles.actionBtn}
                      onClick={() => setSelectedReport(ev)}
                    >
                      View Report
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#aaa', fontStyle: 'italic' }}>No Report</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {selectedReport && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Report: {selectedReport.event_title}</h3>
              <button style={styles.closeBtn} onClick={() => setSelectedReport(null)}></button>
            </div>
            <div style={styles.modalBody}>
              {selectedReport.post_event_report && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginTop: 0, color: theme.colors.maroon }}>Summary</h4>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, color: '#444' }}>
                    {selectedReport.post_event_report}
                  </p>
                </div>
              )}
              
              {selectedReport.report_file_path && (
                <div>
                  <h4 style={{ marginTop: 0, color: theme.colors.maroon }}>Attached File</h4>
                  <a 
                    href={`${API_BASE}/${selectedReport.report_file_path}`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={styles.downloadLink}
                  >
                     Download Report PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  header: {
    marginBottom: '0.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    margin: 0,
    fontSize: '1.8rem',
    color: theme.colors.maroon,
  },
  subtitle: {
    margin: '4px 0 0',
    color: theme.colors.midGray,
  },
  metricsRow: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: '1 1 250px',
    background: '#fff',
    borderRadius: theme.radii.lg,
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    border: '1px solid rgba(0,0,0,0.05)',
    boxShadow: theme.shadows.sm,
  },
  metricIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
  },
  metricValue: {
    fontSize: '1.75rem',
    fontWeight: theme.fontWeights.bold,
    color: '#333',
    lineHeight: 1.2,
  },
  metricLabel: {
    fontSize: '0.85rem',
    color: theme.colors.midGray,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '0.2rem',
  },
  chartSection: {
    background: '#fff',
    borderRadius: theme.radii.lg,
    padding: '1.5rem',
    border: '1px solid rgba(0,0,0,0.05)',
    boxShadow: theme.shadows.sm,
  },
  sectionTitle: {
    margin: '0 0 1.5rem 0',
    fontSize: '1.1rem',
    color: '#333',
    borderBottom: '2px solid rgba(0,0,0,0.05)',
    paddingBottom: '0.5rem',
  },
  chartContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '220px',
    paddingTop: '20px',
  },
  barWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '60px',
  },
  barOuter: {
    height: '150px',
    width: '40px',
    background: 'rgba(0,0,0,0.04)',
    borderRadius: '4px 4px 0 0',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
  },
  barInner: {
    width: '100%',
    background: theme.gradients.goldShine,
    borderRadius: '4px 4px 0 0',
    transition: 'height 1s ease',
  },
  barValue: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: theme.colors.maroon,
    marginBottom: '0.5rem',
  },
  barLabel: {
    fontSize: '0.75rem',
    color: theme.colors.midGray,
    marginTop: '0.5rem',
    textAlign: 'center',
  },
  tableSection: {
    background: '#fff',
    borderRadius: theme.radii.lg,
    padding: '1.5rem',
    border: '1px solid rgba(0,0,0,0.05)',
    boxShadow: theme.shadows.sm,
  },
  tableWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem',
    background: '#fcfcfc',
    borderRadius: theme.radii.md,
    border: '1px solid #eee',
  },
  tableHeader: {
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid #eee',
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.midGray,
    padding: '0.5rem 1rem',
    borderRadius: 0,
  },
  actionBtn: {
    padding: '0.4rem 0.8rem',
    background: 'rgba(74,4,4,0.1)',
    color: theme.colors.maroon,
    border: 'none',
    borderRadius: theme.radii.sm,
    fontSize: '0.8rem',
    fontWeight: theme.fontWeights.semiBold,
    cursor: 'pointer',
    transition: theme.transitions.fast,
  },
  downloadLink: {
    display: 'inline-block',
    padding: '0.6rem 1.2rem',
    background: theme.colors.maroon,
    color: theme.colors.gold,
    textDecoration: 'none',
    borderRadius: theme.radii.md,
    fontWeight: theme.fontWeights.semiBold,
    fontSize: '0.9rem',
    transition: theme.transitions.fast,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modalContent: {
    background: '#fff',
    borderRadius: theme.radii.lg,
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: theme.shadows.lg,
  },
  modalHeader: {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    background: '#fff',
    zIndex: 10,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: '#666',
  },
  modalBody: {
    padding: '1.5rem',
  }
};
