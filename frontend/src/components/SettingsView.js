import React, { useState, useEffect } from 'react';
import theme from '../theme';
import { API_BASE } from '../config/api';
import { Lock, User, CheckCircle, XCircle, Mail, Building2, GraduationCap, Shield, Bell, Palette, Phone } from 'lucide-react';

const s = (...styles) => Object.assign({}, ...styles.filter(Boolean));

// Inject hover CSS once
if (typeof document !== 'undefined' && !document.getElementById('gmu-settings-styles')) {
  const el = document.createElement('style');
  el.id = 'gmu-settings-styles';
  el.textContent = `
    .gmu-settings-input:focus {
      border-color: #701a1e !important; background: #fff !important;
      box-shadow: 0 0 0 3px rgba(112,26,30,0.1) !important; outline: none !important;
    }
    .gmu-settings-tab {
      display: flex; align-items: center; gap: 0.6rem;
      padding: 0.65rem 1.1rem; cursor: pointer; border-radius: 10px;
      font-size: 0.88rem; font-weight: 500; color: #64748b;
      transition: all 0.2s ease; border: none; background: none;
      width: 100%; text-align: left; font-family: inherit;
    }
    .gmu-settings-tab:hover { background: #f8fafc; color: #1e293b; transform: translateX(2px); }
    .gmu-settings-tab.gmu-tab-active { background: linear-gradient(135deg, #701a1e, #8a2126); color: #fff; font-weight: 600; }
    .gmu-save-btn {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.8rem 1.5rem; background: #701a1e; color: #fff; border: none;
      border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer;
      transition: all 0.2s ease; font-family: inherit;
    }
    .gmu-save-btn:hover:not(:disabled) { background: #8a2126; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(112,26,30,0.3); }
    .gmu-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .gmu-profile-field {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1rem;
      background: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9;
      transition: all 0.2s ease;
    }
    .gmu-profile-field:hover { background: #f1f5f9; border-color: #e2e8f0; transform: translateX(2px); }
    .gmu-settings-page-wrap {
      display: flex; gap: 1.5rem; font-family: "Inter", sans-serif; align-items: stretch;
      height: 100%; overflow: hidden; min-height: 0;
    }
    .gmu-settings-sidebar { width: 200px; flex-shrink: 0; }
    @media (max-width: 768px) {
      .gmu-settings-page-wrap { flex-direction: column; overflow-y: auto; height: auto; }
      .gmu-settings-sidebar { width: 100%; flex-shrink: 0; }
    }
  `;
  document.head.appendChild(el);
}

const TABS = [
  { id: 'profile', label: 'Profile Info', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'preferences', label: 'Preferences', icon: Palette },
];

export default function SettingsView({ user, onBack }) {
  const [imgError, setImgError] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(() => {
    return localStorage.getItem(`emailNotifs_${user?.username}`) !== 'false';
  });
  const [browserNotifs, setBrowserNotifs] = useState(() => {
    return localStorage.getItem(`browserNotifs_${user?.username}`) === 'true';
  });

  useEffect(() => {
    if (user?.username) {
      localStorage.setItem(`emailNotifs_${user.username}`, emailNotifs);
    }
  }, [emailNotifs, user?.username]);

  useEffect(() => {
    if (user?.username) {
      localStorage.setItem(`browserNotifs_${user.username}`, browserNotifs);
      if (browserNotifs && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    }
  }, [browserNotifs, user?.username]);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setStatus({ type: 'error', message: 'Passwords do not match.' }); return; }
    if (newPassword === currentPassword) { setStatus({ type: 'error', message: 'Must differ from current password.' }); return; }
    const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;
    if (!re.test(newPassword)) { setStatus({ type: 'error', message: 'Min 6 chars with letters and numbers.' }); return; }
    setLoading(true); setStatus({ type: '', message: '' });
    try {
      const res = await fetch(`${API_BASE}/update_settings.php`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, current_password: currentPassword, new_password: newPassword })
      });
      const data = await res.json();
      if (data.success) { setStatus({ type: 'success', message: data.message }); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
      else { setStatus({ type: 'error', message: data.message }); }
    } catch { setStatus({ type: 'error', message: 'Network error. Try again.' }); }
    finally { setLoading(false); }
  };

  const profileFields = [
    { icon: User, label: 'Full Name', value: user?.name },
    { icon: Mail, label: 'Username / ID', value: user?.username },
    { icon: Phone, label: 'Mobile Number', value: user?.mobile_no || 'Not Provided' },
    { icon: GraduationCap, label: 'Role', value: user?.role?.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') },
    { icon: Building2, label: 'Department', value: user?.department_name },
    { icon: Building2, label: 'School', value: user?.school_name },
  ].filter(f => f.value);

  return (
    <div className="gmu-settings-page-wrap">
      {/* ── Left Tab Panel ── */}
      <aside className="gmu-settings-sidebar" style={st.tabPanelBase}>
        <div style={st.panelHeader}>
          <div style={st.panelAvatar}>
            {!imgError && user?.photo ? (
              <img
                src={user.photo}
                alt="Avatar"
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                onError={() => setImgError(true)}
              />
            ) : (
              <User size={28} color="#FDD06F" />
            )}
          </div>
          <div>
            <p style={st.panelName}>{user?.name?.split(' ')[0] || 'User'}</p>
            <p style={st.panelRole}>{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`gmu-settings-tab${activeTab === tab.id ? ' gmu-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div style={st.contentArea}>
        {activeTab === 'profile' && (
          <div>
            <h2 style={st.sectionTitle}>Profile Information</h2>
            <p style={st.sectionSub}>Your personal and academic details from the university system.</p>
            <div style={st.profileCard}>
              <div style={st.profileBanner}>
                <div style={st.profileAvatarLg}>
                  {!imgError && user?.photo ? (
                    <img
                      src={user.photo}
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <User size={38} color="#FDD06F" />
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{user?.name || 'N/A'}</h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'rgba(253,208,111,0.8)' }}>@{user?.username}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.25rem' }}>
                {profileFields.map(field => {
                  const Icon = field.icon;
                  return (
                    <div key={field.label} className="gmu-profile-field">
                      <div style={st.fieldIconWrap}><Icon size={15} color="#701a1e" /></div>
                      <div>
                        <p style={st.fieldLabel}>{field.label}</p>
                        <p style={st.fieldValue}>{field.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div>
            <h2 style={st.sectionTitle}>Account Security</h2>
            <p style={st.sectionSub}>Update your password to keep your account secure.</p>
            {status.message && (
              <div style={s(st.statusAlert, status.type === 'error' ? st.statusError : st.statusSuccess)}>
                {status.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                <span>{status.message}</span>
              </div>
            )}
            <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Current Password', value: currentPassword, setter: setCurrentPassword, placeholder: 'Enter current password' },
                { label: 'New Password', value: newPassword, setter: setNewPassword, placeholder: 'Min. 6 chars with letters + numbers' },
                { label: 'Confirm New Password', value: confirmPassword, setter: setConfirmPassword, placeholder: 'Repeat new password' },
              ].map(field => (
                <div key={field.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={st.label}>{field.label}</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      type="password"
                      className="gmu-settings-input"
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={e => field.setter(e.target.value)}
                      style={st.input}
                      required
                    />
                  </div>
                </div>
              ))}
              <div style={st.infoBanner}>
                <Shield size={13} color="#B8860B" />
                <span>Use at least 6 characters including letters and numbers.</span>
              </div>
              <button type="submit" className="gmu-save-btn" disabled={loading}>
                <Lock size={15} />
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div>
            <h2 style={st.sectionTitle}>Preferences</h2>
            <p style={st.sectionSub}>Customize your notification and display settings.</p>
            <div style={{ background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              {[
                { icon: Bell, label: 'Email Notifications', desc: 'Updates about event registrations and approvals', enabled: emailNotifs, setter: setEmailNotifs },
                { icon: Bell, label: 'Browser Notifications', desc: 'Instant alerts in your browser', enabled: browserNotifs, setter: setBrowserNotifs },
              ].map((pref, i) => {
                const Icon = pref.icon;
                return (
                  <div key={pref.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: i === 0 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={st.fieldIconWrap}><Icon size={15} color="#701a1e" /></div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>{pref.label}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#64748b' }}>{pref.desc}</p>
                      </div>
                    </div>
                    <div onClick={() => pref.setter(!pref.enabled)} style={{ width: '42px', height: '22px', borderRadius: '11px', background: pref.enabled ? '#701a1e' : '#e2e8f0', position: 'relative', cursor: 'pointer' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: pref.enabled ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const st = {
  tabPanelBase: {
    background: '#fff', borderRadius: '16px',
    border: '1px solid #e2e8f0', padding: '1rem', display: 'flex', flexDirection: 'column',
    gap: '0.75rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', overflow: 'hidden',
  },
  panelHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.65rem', borderBottom: '1px solid #f1f5f9' },
  panelAvatar: { width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #701a1e, #8a2126)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  panelName: { margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' },
  panelRole: { margin: '2px 0 0', fontSize: '0.68rem', color: '#64748b', textTransform: 'capitalize' },
  contentArea: { flex: 1, background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', overflowY: 'auto', minHeight: 0 },
  sectionTitle: { fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem' },
  sectionSub: { fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem' },
  profileCard: { border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' },
  profileBanner: { background: 'linear-gradient(135deg, #701a1e 0%, #4a0404 100%)', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' },
  profileAvatarLg: { width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(253,208,111,0.2)', border: '2px solid rgba(253,208,111,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  fieldIconWrap: { width: '28px', height: '28px', borderRadius: '7px', background: '#FFF5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  fieldLabel: { margin: 0, fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' },
  fieldValue: { margin: '2px 0 0', fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 },
  label: { fontSize: '0.83rem', fontWeight: 600, color: '#0f172a' },
  input: { width: '100%', boxSizing: 'border-box', padding: '0.65rem 1rem 0.65rem 2.4rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.88rem', color: '#334155', transition: 'all 0.2s ease', fontFamily: 'inherit' },
  infoBanner: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFF8E1', color: '#8D6E63', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 500 },
  statusAlert: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.83rem', fontWeight: 600, marginBottom: '0.75rem' },
  statusSuccess: { background: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7' },
  statusError: { background: '#FFEBEE', color: '#C62828', border: '1px solid #EF9A9A' },
};


