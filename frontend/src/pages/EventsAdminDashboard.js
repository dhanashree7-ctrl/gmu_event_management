/**
 * src/pages/EventsAdminDashboard.js
 * -----------------------------------------------------------------
 * Administrator dashboard for managing global routing configuration.
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { API_BASE } from "../config/api";
import { useAuth } from "../context/AuthContext";
import theme from "../theme";
import EventArchive from '../components/EventArchive';
import AdminReportsView from '../components/AdminReportsView';
import DashboardMetrics from '../components/DashboardMetrics';
import DashboardLayout from '../components/layout/DashboardLayout';

// ── Utility ─────────────────────────────────────────────────────────────────
const s = (...styles) => Object.assign({}, ...styles);

// ── Constants ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: '', label: 'Dashboard', active: true },
  { icon: '', label: 'Current Routings', active: false },
  { icon: '️', label: 'Configure Routing', active: false },
  { icon: '', label: 'Manage Users', active: false },
  { icon: '', label: 'Reports & Analytics', active: false },
  { icon: '️', label: 'Archive', active: false },
];

const roleBankGlobal = [
  { id: 'role-hod', label: 'HOD', value: 'hod' },
  { id: 'role-director', label: 'Director', value: 'director' },
  { id: 'role-dean', label: 'Dean', value: 'dean' },
  { id: 'role-provc', label: 'Pro-VC', value: 'pro_vc' },
  { id: 'role-vc', label: 'VC', value: 'vc' }
];

// ── Sub-components ───────────────────────────────────────────────────────────

// (Global Sidebar is now used)

// ── Views ────────────────────────────────────────────────────────────────────

function CurrentRoutingsView({ rules }) {
  return (
    <div style={styles.viewContainer}>
      <div style={styles.topBar}>
        <div>
          <h2 style={{ margin: 0, color: theme.colors.maroon }}>Current Routings</h2>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Overview of the global approval hierarchy for all event scales.</p>
        </div>
      </div>
      <div style={styles.listContainer}>
        {rules.map(rule => (
          <div key={rule.id} style={styles.ruleCard}>
            <h3 style={styles.ruleScaleTitle}>{rule.scale_name.charAt(0).toUpperCase() + rule.scale_name.slice(1)} Level</h3>
            <div style={styles.chainContainer}>
              {(!rule.required_chain || rule.required_chain.length === 0) ? (
                <span style={{ color: '#aaa', fontStyle: 'italic' }}>No routing defined.</span>
              ) : (
                rule.required_chain.map((roleValue, idx) => {
                  const roleDef = roleBankGlobal.find(r => r.value === roleValue);
                  return (
                    <React.Fragment key={`${rule.id}-${idx}`}>
                      <div style={styles.pill}>{roleDef ? roleDef.label : roleValue}</div>
                      {idx < rule.required_chain.length - 1 && (
                        <span style={styles.arrow}></span>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfigureRoutingView({ rules, setRules, selectedScaleId, setSelectedScaleId, onAddNew }) {
  const currentRuleIndex = rules.findIndex(r => r.id === selectedScaleId);
  const currentRule = rules[currentRuleIndex];

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (currentRuleIndex === -1) return;

    let newChain = [...(currentRule.required_chain || [])];

    if (source.droppableId === 'roleBank' && destination.droppableId === 'approvalChain') {
      const draggedRole = roleBankGlobal[source.index].value;
      if (newChain.includes(draggedRole)) {
        alert("This role is already in the chain.");
        return;
      }
      newChain.splice(destination.index, 0, draggedRole);
    } else if (source.droppableId === 'approvalChain' && destination.droppableId === 'approvalChain') {
      const [removed] = newChain.splice(source.index, 1);
      newChain.splice(destination.index, 0, removed);
    } else if (source.droppableId === 'approvalChain' && destination.droppableId === 'roleBank') {
      newChain.splice(source.index, 1);
    }

    const updatedRules = [...rules];
    updatedRules[currentRuleIndex] = { ...currentRule, required_chain: newChain };
    setRules(updatedRules);
  };

  const saveChain = async () => {
    const isConfirmed = window.confirm("Are you sure you want to update the global routing configuration for this event scale?");
    if (!isConfirmed) return;

    const ruleToSave = rules.find(r => r.id === selectedScaleId);
    if (!ruleToSave) return;

    try {
      const res = await fetch(`${API_BASE}/update_approval_rules.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ruleToSave.id,
          required_chain: ruleToSave.required_chain
        })
      });
      const json = await res.json();
      if (json.success) {
        alert("Routing configuration saved successfully!");
      } else {
        alert(json.message);
      }
    } catch (err) {
      alert("Error saving configuration.");
    }
  };

  return (
    <div style={styles.viewContainer}>
      <div style={styles.topBar}>
        <div>
          <label style={styles.label}>Select Event Scale:</label>
          <select
            style={styles.select}
            value={selectedScaleId || ''}
            onChange={(e) => setSelectedScaleId(Number(e.target.value))}
          >
            {rules.map(r => (
              <option key={r.id} value={r.id}>
                {r.scale_name.charAt(0).toUpperCase() + r.scale_name.slice(1)} Level
              </option>
            ))}
          </select>
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={onAddNew} style={{ ...styles.saveBtn, background: '#1565c0' }}>
            + Add New Scale
          </button>
          <button onClick={saveChain} style={styles.saveBtn}>
            Save Changes
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={styles.dndContainer}>
          {/* ZONE A: Role Bank */}
          <div style={styles.zoneBox}>
            <h3 style={styles.zoneTitle}>Role Bank</h3>
            <p style={styles.zoneDesc}>Drag roles into the chain.</p>
            <Droppable droppableId="roleBank" isDropDisabled={false}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{ ...styles.droppableArea, background: snapshot.isDraggingOver ? '#f0f4ff' : '#fafafa' }}
                >
                  {roleBankGlobal.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...styles.draggableItem,
                            ...provided.draggableProps.style,
                            boxShadow: snapshot.isDragging ? '0 4px 8px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                          }}
                        >
                          <span style={styles.dragIcon}>⠿</span> {item.label}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* ZONE B: Approval Chain */}
          <div style={styles.zoneBox}>
            <h3 style={styles.zoneTitle}>Approval Chain</h3>
            <p style={styles.zoneDesc}>Define the exact routing order for <strong>{currentRule?.scale_name || 'selected'}</strong> events.</p>
            <Droppable droppableId="approvalChain">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{ ...styles.droppableArea, background: snapshot.isDraggingOver ? '#e8f5e9' : '#fff', minHeight: '300px', border: '2px dashed #ccc' }}
                >
                  {currentRule?.required_chain?.map((roleValue, index) => {
                    const roleObj = roleBankGlobal.find(rb => rb.value === roleValue) || { label: roleValue, id: `chain-${index}` };
                    return (
                      <Draggable key={`chain-${roleValue}`} draggableId={`chain-${roleValue}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...styles.draggableItem,
                              background: '#e3f2fd',
                              border: '1px solid #1565c0',
                              ...provided.draggableProps.style,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={styles.stepBadge}>{index + 1}</span>
                              {roleObj.label}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                  {(!currentRule?.required_chain || currentRule.required_chain.length === 0) && !snapshot.isDraggingOver && (
                    <div style={styles.emptyState}>No approvers set. Drag roles here!</div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}

function ManageUsersView() {
  const [formData, setFormData] = React.useState({
    full_name: '',
    usn_or_emp_id: '',
    email: '',
    password: '',
    system_role: 'student',
    department: ''
  });
  const [status, setStatus] = React.useState(null);

  const roles = [
    { value: 'student', label: 'Student' },
    { value: 'faculty', label: 'Faculty' },
    { value: 'hod', label: 'HOD' },
    { value: 'director', label: 'Director' },
    { value: 'dean', label: 'Dean' },
    { value: 'pro_vc', label: 'Pro-VC' },
    { value: 'vc', label: 'VC' },
    { value: 'admin', label: 'Admin' },
    { value: 'events_admin', label: 'Events Admin' }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Creating user...' });
    try {
      const res = await fetch(`${API_BASE}/add_user.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: data.message });
        setFormData({ full_name: '', usn_or_emp_id: '', email: '', password: '', system_role: 'student', department: '' });
      } else {
        setStatus({ type: 'error', message: data.message });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    }
  };

  return (
    <div style={styles.viewContainer}>
      <div style={styles.topBar}>
        <div>
          <h2 style={{ margin: 0, color: theme.colors.maroon }}>Manage Users</h2>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Manually add new users to the system.</p>
        </div>
      </div>
      <div style={styles.formCard}>
        {status && (
          <div style={{ ...styles.statusMsg, backgroundColor: status.type === 'error' ? '#ffebee' : status.type === 'success' ? '#e8f5e9' : '#e3f2fd', color: status.type === 'error' ? '#c62828' : status.type === 'success' ? '#2e7d32' : '#1565c0' }}>
            {status.message}
          </div>
        )}
        <form onSubmit={handleSubmit} style={styles.userForm}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Full Name</label>
            <input name="full_name" value={formData.full_name} onChange={handleChange} style={styles.formInput} required />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>USN / Employee ID</label>
            <input name="usn_or_emp_id" value={formData.usn_or_emp_id} onChange={handleChange} style={styles.formInput} required />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} style={styles.formInput} required />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Password</label>
            <input name="password" type="password" value={formData.password} onChange={handleChange} style={styles.formInput} required />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>System Role</label>
            <select name="system_role" value={formData.system_role} onChange={handleChange} style={styles.formInput}>
              {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Department (Optional)</label>
            <input name="department" value={formData.department} onChange={handleChange} style={styles.formInput} placeholder="e.g. AIML, CS" />
          </div>
          <div style={{ gridColumn: '1 / -1', marginTop: '1rem', textAlign: 'right' }}>
            <button type="submit" style={styles.submitBtn}>Add User</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function EventsAdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [selectedScaleId, setSelectedScaleId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [activeNav, setActiveNav] = useState(location.state?.activeNav || 'Dashboard');

  useEffect(() => {
    if (!user || user.role !== "events_admin") {
      navigate("/login");
      return;
    }
    fetchRules();
  }, [user, navigate]);

  const fetchRules = async () => {
    try {
      const res = await fetch(`${API_BASE}/get_approval_rules.php`);
      const json = await res.json();
      if (json.success) {
        setRules(json.data);
        if (json.data.length > 0) setSelectedScaleId(json.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ADD NEW SCALE LOGIC
  const handleAddNewScale = async () => {
    const newScaleName = window.prompt("Enter the name of the new Event Scale (e.g., 'National'):");
    if (!newScaleName || newScaleName.trim() === "") return;

    try {
      const response = await fetch(`${API_BASE}/add_approval_rule.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scale_name: newScaleName.trim() })
      });
      const data = await response.json();

      if (data.success) {
        alert(`Success! "${newScaleName}" has been added.`);
        fetchRules(); // Refresh the rules list from the database
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error adding scale:", error);
      alert("Failed to connect to the server.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) return <div style={styles.loading}>Loading configurations...</div>;

  return (
    <DashboardLayout role="events_admin" activeNav={activeNav} onNavChange={setActiveNav}>
          {activeNav === 'Dashboard' && (
            <div style={styles.viewContainer}>
              <div style={styles.topBar}>
                <div>
                  <h2 style={{ margin: 0, color: theme.colors.maroon }}>Global Dashboard</h2>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>System-wide routing overview</p>
                </div>
              </div>
              <DashboardMetrics 
                data={[
                  { name: 'Active Routings', count: rules.length },
                  { name: 'University Level', count: rules.filter(r => r.scale_name === 'university').length },
                  { name: 'Department Level', count: rules.filter(r => r.scale_name === 'department').length },
                ]} 
                type="overview" 
              />
            </div>
          )}
          {activeNav === 'Current Routings' && <CurrentRoutingsView rules={rules} />}
          {activeNav === 'Manage Users' && <ManageUsersView />}
          {activeNav === 'Reports & Analytics' && <AdminReportsView user={user} />}
          {activeNav === 'Archive' && <EventArchive user={user} />}

          {activeNav === 'Configure Routing' && (
            <ConfigureRoutingView
              rules={rules}
              setRules={setRules}
              selectedScaleId={selectedScaleId}
              setSelectedScaleId={setSelectedScaleId}
              onAddNew={handleAddNewScale}
            />
          )}
    </DashboardLayout>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  layout: { display: 'flex', minHeight: '100vh', background: theme.colors.offWhite || '#FAF8F5', fontFamily: theme.fonts?.sansSerif || "'Inter', sans-serif" },
  sidebar: { width: '240px', minHeight: '100vh', background: theme.gradients?.header || theme.colors.maroon, display: 'flex', flexDirection: 'column', padding: '1.5rem 0', transition: 'width 0.25s ease', flexShrink: 0, position: 'sticky', top: 0, overflowX: 'hidden', zIndex: 10 },
  sidebarCollapsed: { width: '64px' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 1.25rem 1rem', whiteSpace: 'nowrap', overflow: 'hidden' },
  sidebarCrest: { fontSize: '1.8rem', color: theme.colors.gold, flexShrink: 0 },
  sidebarLogoName: { fontFamily: theme.fonts?.serif || 'serif', fontSize: '0.95rem', fontWeight: 'bold', color: theme.colors.gold, lineHeight: 1.1 },
  sidebarLogoSub: { fontSize: '0.6rem', color: 'rgba(253,208,111,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase' },
  divider: { height: '1px', background: 'rgba(253,208,111,0.15)', margin: '0 1.25rem 1rem' },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0 0.75rem', flex: 1 },
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

  mainArea: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' },
  topHeader: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 2rem', background: '#ffffff', borderBottom: '1px solid #ede9e3', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'sticky', top: 0, zIndex: 100 },
  hamburger: { background: 'transparent', border: '1px solid #ddd', borderRadius: '6px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.maroon, flexShrink: 0 },
  headerTitle: { fontFamily: theme.fonts?.serif || 'serif', fontSize: '1.2rem', fontWeight: 'bold', color: '#333', lineHeight: 1.1 },
  headerSubtitle: { fontSize: '0.75rem', color: '#666' },
  headerProfile: { textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  headerLogoutBtn: { background: theme.colors.maroon, color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' },
  contentArea: { padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', overflowY: 'auto', flex: 1 },

  loading: { textAlign: 'center', padding: '3rem', fontSize: '1.2rem', color: '#666' },
  viewContainer: { maxWidth: "1600px", margin: "0 auto", width: "100%" },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: theme.shadows.light, marginBottom: '2rem' },
  label: { fontWeight: 600, marginRight: '1rem', color: '#333' },
  select: { padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', minWidth: '200px' },
  saveBtn: { background: theme.colors.maroon, color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' },
  dndContainer: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' },
  zoneBox: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: theme.shadows.light },
  zoneTitle: { margin: '0 0 0.5rem 0', color: theme.colors.maroon },
  zoneDesc: { margin: '0 0 1.5rem 0', color: '#666', fontSize: '0.9rem' },
  droppableArea: { padding: '1rem', borderRadius: '8px', border: '1px solid #eee', transition: 'background 0.2s ease' },
  draggableItem: { display: 'flex', alignItems: 'center', padding: '1rem', marginBottom: '0.5rem', background: '#fff', borderRadius: '6px', border: '1px solid #ddd', cursor: 'grab', userSelect: 'none', fontWeight: 500, color: '#333' },
  dragIcon: { color: '#bbb', cursor: 'grab' },
  stepBadge: { background: '#1565c0', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' },
  emptyState: { textAlign: 'center', padding: '3rem', color: '#aaa', fontStyle: 'italic' },

  // Routings List Specific
  listContainer: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  ruleCard: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: theme.shadows.light, display: 'flex', flexDirection: 'column', gap: '1rem' },
  ruleScaleTitle: { margin: 0, fontSize: '1.2rem', color: theme.colors.charcoal },
  chainContainer: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' },
  pill: { background: '#e3f2fd', color: '#1565c0', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600, border: '1px solid #bbdefb' },
  arrow: { color: '#999', fontSize: '1.2rem' },
  formCard: { background: '#fff', borderRadius: '12px', padding: '2.5rem', boxShadow: theme.shadows.light, maxWidth: '800px', margin: '0 auto' },
  userForm: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  formLabel: { fontSize: '0.9rem', fontWeight: 600, color: '#444' },
  formInput: { padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', fontFamily: 'inherit' },
  submitBtn: { padding: '0.75rem 2rem', background: theme.colors.maroon, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
  statusMsg: { padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', fontWeight: 500, fontSize: '0.95rem', gridColumn: '1 / -1' }
};