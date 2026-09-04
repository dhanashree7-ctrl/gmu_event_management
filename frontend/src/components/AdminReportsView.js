import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import theme from '../theme';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import DashboardMetrics from './DashboardMetrics';

const s = (...styles) => Object.assign({}, ...styles.filter(Boolean));

export default function AdminReportsView({ user }) {
  const navigate = useNavigate();
  const [options, setOptions] = useState({ academic_years: [], events: [], departments: [] });
  const [reportData, setReportData] = useState({ metrics: null, participants: [], events_info: [] });
  
  const [filters, setFilters] = useState({
    academicYear: 'all',
    eventId: 'all',
    faculty: [],
    school: [],
    department: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchOptions = async () => {
    try {
      const res = await fetch(`${API_BASE}/get_admin_report_options.php`);
      const json = await res.json();
      if (json.success) setOptions(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const facParam = filters.faculty.length ? filters.faculty.map(f => f.value).join(',') : 'all';
      const schParam = filters.school.length ? filters.school.map(s => s.value).join(',') : 'all';
      const depParam = filters.department.length ? filters.department.map(d => d.value).join(',') : 'all';
      const url = `${API_BASE}/get_admin_report_data.php?academic_year=${filters.academicYear}&event_id=${filters.eventId}&faculty=${encodeURIComponent(facParam)}&school=${encodeURIComponent(schParam)}&department=${encodeURIComponent(depParam)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setReportData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const filteredData = reportData.participants || [];
    if (!filteredData.length) return alert('No data to export');
    const ws = XLSX.utils.json_to_sheet(filteredData.map(p => ({
      Event: p.event_title,
      'Participant Name': p.participant_name,
      USN: p.usn,
      Programme: p.programme,
      Role: p.role,
      School: p.school_name,
      Discipline: p.department,
      Department: p.department
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participants");
    XLSX.writeFile(wb, `Admin_Report_${new Date().getTime()}.xlsx`);
  };

  const handleExportPDF = () => {
    const filteredData = reportData.participants || [];
    if (!filteredData.length) return alert('No data to export');
    const doc = new jsPDF();
    
    // Draw text "logo"
    doc.setFontSize(22);
    doc.setTextColor(107, 21, 25); // Maroon
    doc.text("GM University", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Event System", 14, 26);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Admin Event Reports & Analytics", 14, 38);
    
    const tableColumn = ["Event", "Name", "USN", "Role", "School", "Sem", "Dept"];
    const tableRows = filteredData.map(p => [
      p.event_title, p.participant_name, p.usn, p.role, p.school_name, p.programme, p.department
    ]);

    const roleCounts = filteredData.reduce((acc, p) => {
      let r = p.role;
      if (!r || r === 'Unknown') r = 'Other';
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});
    
    let currentY = 48;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Role Breakdown", 14, currentY);
    currentY += 6;
    
    const maxCount = Math.max(...Object.values(roleCounts), 1);
    
    Object.entries(roleCounts).forEach(([role, count]) => {
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(role, 14, currentY);
      doc.setFillColor(107, 21, 25);
      const barWidth = (count / maxCount) * 100;
      doc.rect(50, currentY - 3, barWidth, 4, 'F');
      doc.text(count.toString(), 55 + barWidth, currentY);
      currentY += 7;
    });
    
    const tableStartY = currentY + 10;

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: tableStartY,
      styles: { fontSize: 8 }
    });
    
    doc.save(`Admin_Report_${new Date().getTime()}.pdf`);
  };

  const handleExportEventsExcel = () => {
    const data = reportData.events_info || [];
    if (!data.length) return alert('No event data to export');
    const ws = XLSX.utils.json_to_sheet(data.map(e => ({
      'Event ID': e.id,
      'Event Title': e.event_title,
      'Category': e.category,
      'Scale': e.event_scale,
      'Department': e.department,
      'Average Rating': e.average_rating,
      'Budget': e.budget
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Events Analytics");
    XLSX.writeFile(wb, `Admin_Events_Report_${new Date().getTime()}.xlsx`);
  };

  const handleExportEventsPDF = () => {
    const data = reportData.events_info || [];
    if (!data.length) return alert('No event data to export');
    const doc = new jsPDF();
    
    // Draw text "logo"
    doc.setFontSize(22);
    doc.setTextColor(107, 21, 25); // Maroon
    doc.text("GM University", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Event System", 14, 26);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Admin Event Analytics", 14, 38);
    
    const tableColumn = ["ID", "Title", "Category", "Scale", "Dept", "Rating", "Budget"];
    const tableRows = data.map(e => [
      e.id, e.event_title, e.category, e.event_scale, e.department, e.average_rating, e.budget
    ]);

    const categoryCounts = data.reduce((acc, ev) => {
      const cat = ev.category || 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    
    let currentY = 48;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Category Breakdown", 14, currentY);
    currentY += 6;
    
    const maxCount = Math.max(...Object.values(categoryCounts), 1);
    
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(cat, 14, currentY);
      doc.setFillColor(107, 21, 25);
      const barWidth = (count / maxCount) * 100;
      doc.rect(50, currentY - 3, barWidth, 4, 'F');
      doc.text(count.toString(), 55 + barWidth, currentY);
      currentY += 7;
    });
    
    const tableStartY = currentY + 10;

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: tableStartY,
      styles: { fontSize: 8 }
    });
    
    doc.save(`Admin_Events_Report_${new Date().getTime()}.pdf`);
  };

  const { metrics, participants, events_info } = reportData;

  const uniqueDepts = metrics?.department_breakdown ? Object.keys(metrics.department_breakdown).length : 0;
  const topProg = metrics?.programme_breakdown ? Object.keys(metrics.programme_breakdown).sort((a,b) => metrics.programme_breakdown[b] - metrics.programme_breakdown[a])[0] : 'N/A';

  const availableFaculties = options.hierarchy ? Object.keys(options.hierarchy) : [];
  let availableSchools = [];
  if (options.hierarchy) {
    if (filters.faculty.length > 0) {
      filters.faculty.forEach(f => {
        if (options.hierarchy[f.value]) {
          availableSchools = [...availableSchools, ...Object.keys(options.hierarchy[f.value])];
        }
      });
      availableSchools = [...new Set(availableSchools)];
    } else {
      Object.values(options.hierarchy).forEach(schools => {
        availableSchools = [...availableSchools, ...Object.keys(schools)];
      });
      availableSchools = [...new Set(availableSchools)];
    }
  }
  
  let groupedDepartments = [];
  if (options.hierarchy) {
    let schoolDeptMap = {};
    let validFaculties = filters.faculty.length > 0 ? filters.faculty.map(f => f.value) : Object.keys(options.hierarchy);
    
    validFaculties.forEach(fac => {
      let schoolsInFac = options.hierarchy[fac];
      if (schoolsInFac) {
        let validSchoolsInFac = filters.school.length > 0 
          ? Object.keys(schoolsInFac).filter(s => filters.school.find(fs => fs.value === s))
          : Object.keys(schoolsInFac);
          
        validSchoolsInFac.forEach(sch => {
           let depts = schoolsInFac[sch];
           if (depts && depts.length > 0) {
             if (!schoolDeptMap[sch]) schoolDeptMap[sch] = new Set();
             depts.forEach(d => schoolDeptMap[sch].add(d));
           }
        });
      }
    });

    groupedDepartments = Object.keys(schoolDeptMap).sort().map(sch => ({
      label: sch,
      options: Array.from(schoolDeptMap[sch]).sort().map(d => ({ value: d, label: d }))
    }));
  } else if (options.departments) {
    groupedDepartments = [{
      label: 'Departments',
      options: options.departments.map(d => ({ value: d, label: d }))
    }];
  }

  // Aggregate participant metrics for charts
  const roleCounts = participants.reduce((acc, p) => {
    let r = p.role;
    if (!r || r === 'Unknown') {
      r = (p.usn && p.usn.startsWith('EXT')) ? 'External' : 'Other';
    }
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});
  const roleData = Object.entries(roleCounts).map(([name, count]) => ({ name, count }));

  const deptCounts = participants.reduce((acc, p) => {
    let d = p.department;
    if (!d || d === 'Unknown') {
      d = (p.usn && p.usn.startsWith('EXT')) ? 'External' : 'Other';
    }
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const deptData = Object.entries(deptCounts).map(([name, count]) => ({ name, count }));

  const participationByEvent = participants.reduce((acc, p) => {
    acc[p.event_title] = (acc[p.event_title] || 0) + 1;
    return acc;
  }, {});
  const participationData = Object.entries(participationByEvent)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>Reports & Analytics</h2>
          <p style={styles.subtitle}>Aggregate participant data and view metrics across all events.</p>
        </div>
        <div style={styles.exportGroup}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ alignSelf: 'center', fontWeight: 600, color: '#555', fontSize: '0.85rem', marginRight: '0.5rem' }}>Participants:</span>
            <button onClick={handleExportExcel} style={s(styles.btn, { background: '#2E7D32', color: '#fff', fontSize: '0.85rem' })}>
               Excel
            </button>
            <button onClick={handleExportPDF} style={s(styles.btn, { background: '#D32F2F', color: '#fff', fontSize: '0.85rem' })}>
               PDF
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ alignSelf: 'center', fontWeight: 600, color: '#555', fontSize: '0.85rem', marginRight: '0.5rem' }}>Events:</span>
            <button onClick={handleExportEventsExcel} style={s(styles.btn, { background: '#2E7D32', color: '#fff', fontSize: '0.85rem' })}>
               Excel
            </button>
            <button onClick={handleExportEventsPDF} style={s(styles.btn, { background: '#D32F2F', color: '#fff', fontSize: '0.85rem' })}>
               PDF
            </button>
          </div>
        </div>
      </div>

      <div style={styles.filterCard}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Academic Year</label>
          <Select 
            value={{ value: filters.academicYear, label: filters.academicYear === 'all' ? 'All Years' : filters.academicYear }}
            onChange={(selected) => setFilters(f => ({ ...f, academicYear: selected ? selected.value : 'all' }))}
            options={[
              { value: 'all', label: 'All Years' },
              ...options.academic_years.map(y => ({ value: y, label: y }))
            ]}
            isSearchable={false}
            styles={{ control: (base) => ({ ...base, minHeight: '44px', borderRadius: '6px' }) }}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Event Selection</label>
          <Select 
            value={filters.eventId === 'all' ? { value: 'all', label: 'All Events' } : { value: filters.eventId, label: options.events.find(e => e.id === filters.eventId)?.title || 'Unknown Event' }}
            onChange={(selected) => setFilters(f => ({ ...f, eventId: selected ? selected.value : 'all' }))}
            options={[
              { value: 'all', label: 'All Events' },
              ...options.events.map(ev => ({ value: ev.id, label: ev.title }))
            ]}
            isSearchable={true}
            placeholder="Search events..."
            styles={{ control: (base) => ({ ...base, minHeight: '44px', borderRadius: '6px' }) }}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Faculty</label>
          <Select 
            isMulti
            value={filters.faculty} 
            onChange={(selected) => setFilters(f => ({ ...f, faculty: selected || [], school: [], department: [] }))}
            options={availableFaculties.map(f => ({ value: f, label: f }))}
            placeholder="All Faculties"
            styles={{ control: (base) => ({ ...base, minHeight: '44px', borderRadius: '6px' }) }}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>School</label>
          <Select 
            isMulti
            value={filters.school} 
            onChange={(selected) => setFilters(f => ({ ...f, school: selected || [], department: [] }))}
            options={availableSchools.map(s => ({ value: s, label: s }))}
            placeholder="All Schools"
            styles={{ control: (base) => ({ ...base, minHeight: '44px', borderRadius: '6px' }) }}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Department</label>
          <Select 
            isMulti
            value={filters.department} 
            onChange={(selected) => setFilters(f => ({ ...f, department: selected || [] }))}
            options={groupedDepartments}
            placeholder="All Departments"
            styles={{ control: (base) => ({ ...base, minHeight: '44px', borderRadius: '6px' }) }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>Crunching numbers...</div>
      ) : (
        <>
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <div style={styles.metricValue}>{metrics?.total_participants || 0}</div>
              <div style={styles.metricLabel}>Total Participants</div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricValue}>{uniqueDepts}</div>
              <div style={styles.metricLabel}>Unique Departments</div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricValue}>{topProg || '-'}</div>
              <div style={styles.metricLabel}>Top Programme</div>
            </div>
          </div>
          
          {participants.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#555', marginBottom: '0.5rem' }}>Participant Analytics</h3>
                <DashboardMetrics data={roleData} type="status" barName="Total Participants" title="Role Distribution" pieTitle="Roles Distribution" />
                <DashboardMetrics data={deptData} type="category" barName="Total Participants" title="Department Distribution" pieTitle="Department Breakdown" />
                {participationData.length > 0 && (
                  <DashboardMetrics data={participationData} type="status" barName="Attendees" title="Top 10 Events by Participation" pieTitle="Top Events Distribution" />
                )}
              </div>
            </div>
          )}

          {events_info.filter(ev => ev.report_pdf_path).length > 0 && (
            <div style={styles.reportsSection}>
              <h3 style={{ marginTop: 0, color: theme.colors.maroon }}>Available Post-Event Reports</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {events_info.filter(ev => ev.report_pdf_path).map(ev => (
                  <a 
                    key={ev.id}
                    href={`${API_BASE}/${ev.report_pdf_path}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={styles.pdfButton}
                  >
                     View Report: {ev.event_title || ev.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div style={styles.tableCard}>
            <h3 style={{ margin: '0 0 1rem', color: '#333' }}>Participant Data</h3>
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Event</th>
                    <th style={styles.th}>Participant</th>
                    <th style={styles.th}>USN/ID</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>School</th>
                    <th style={styles.th}>Dept</th>
                    <th style={styles.th}>Sem</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No records found for current filters.</td>
                    </tr>
                  ) : (
                    participants.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td 
                          style={s(styles.td, styles.clickableEvent)}
                          onClick={() => navigate(`/admin-reports/event/${p.event_id}`)}
                          title="Click to view detailed metrics on a new page"
                        >
                          {p.event_title}
                        </td>
                        <td style={styles.td}>{p.participant_name}</td>
                        <td style={styles.td}>{p.usn}</td>
                        <td style={styles.td}>{p.role}</td>
                        <td style={styles.td}>{p.school_name || 'N/A'}</td>
                        <td style={styles.td}>{p.department}</td>
                        <td style={styles.td}>{p.programme || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'inherit' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' },
  title: { margin: 0, color: theme.colors.maroon, fontSize: '1.8rem' },
  subtitle: { margin: '0.25rem 0 0', color: '#666' },
  exportGroup: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  btn: { padding: '0.6rem 1.25rem', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  filterCard: { background: '#fff', borderRadius: '12px', padding: '1.5rem', display: 'flex', gap: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#444' },
  select: { padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' },
  metricCard: { background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', borderRadius: '20px', padding: '2rem', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08), 0 4px 10px -5px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)', position: 'relative', overflow: 'hidden', transition: 'transform 0.3s ease' },
  metricValue: { fontSize: '3rem', fontWeight: '800', background: `linear-gradient(135deg, ${theme.colors.maroon}, #e11d48)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1, letterSpacing: '-0.02em' },
  metricLabel: { marginTop: '0.75rem', fontSize: '0.95rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
  reportsSection: { background: '#FFF8E1', padding: '1.5rem', borderRadius: '12px', borderLeft: `5px solid ${theme.colors.gold}` },
  pdfButton: { display: 'inline-flex', alignItems: 'center', background: '#fff', color: theme.colors.maroon, border: `1px solid ${theme.colors.maroon}`, padding: '0.6rem 1rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  tableCard: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  tableResponsive: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' },
  th: { padding: '1rem', background: '#f5f5f5', color: '#333', fontWeight: 600, borderBottom: '2px solid #ddd' },
  td: { padding: '1rem', color: '#555' },
  clickableEvent: { color: theme.colors.primary || '#1976d2', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }
};

