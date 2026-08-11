import React, { useState } from 'react';
import theme from '../theme';
import { API_BASE } from '../config/api';

const s = (...styles) => Object.assign({}, ...styles);

export default function SettingsView({ user }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    
    if (newPassword === currentPassword) {
      setStatus({ type: 'error', message: 'New password must be different from current password.' });
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setStatus({ type: 'error', message: 'Password must be at least 8 characters long and contain both letters and numbers.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch(`${API_BASE}/update_settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setStatus({ type: 'success', message: data.message });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatus({ type: 'error', message: data.message });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Account Settings</h2>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button 
          style={s(styles.tabButton, activeTab === 'profile' && styles.tabButtonActive)}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile Information
        </button>
        <button 
          style={s(styles.tabButton, activeTab === 'security' && styles.tabButtonActive)}
          onClick={() => {
            setActiveTab('security');
            setStatus({ type: '', message: '' });
          }}
        >
          🔒 Security
        </button>
      </div>

      <div style={styles.content}>
        {/* Profile Section (Read-Only) */}
        {activeTab === 'profile' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Profile Information</h3>
            <div style={styles.profileGrid}>
              <div style={styles.profileItem}>
                <span style={styles.profileLabel}>Name</span>
                <span style={styles.profileValue}>{user?.name || 'N/A'}</span>
              </div>
              <div style={styles.profileItem}>
                <span style={styles.profileLabel}>Username</span>
                <span style={styles.profileValue}>{user?.username || 'N/A'}</span>
              </div>
              <div style={styles.profileItem}>
                <span style={styles.profileLabel}>Role</span>
                <span style={styles.profileValue}>
                  {user?.role?.replace('_', ' ') || 'N/A'}
                </span>
              </div>
              <div style={styles.profileItem}>
                <span style={styles.profileLabel}>Department</span>
                <span style={styles.profileValue}>{user?.department_name || 'N/A'}</span>
              </div>
              <div style={styles.profileItem}>
                <span style={styles.profileLabel}>School</span>
                <span style={styles.profileValue}>{user?.school_name || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Security Section */}
        {activeTab === 'security' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Security</h3>
            <p style={styles.sectionDesc}>Update your account password below.</p>

            <form onSubmit={handlePasswordUpdate} style={styles.form}>
              {status.message && (
                <div style={s(styles.statusAlert, status.type === 'error' ? styles.statusError : styles.statusSuccess)}>
                  {status.message}
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <button type="submit" disabled={loading} style={s(styles.button, loading && styles.buttonDisabled)}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: theme.fonts.sansSerif,
    color: theme.colors.darkGray,
  },
  header: {
    fontSize: '2rem',
    color: theme.colors.maroon,
    marginBottom: '1rem',
  },
  tabsContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    borderBottom: `2px solid ${theme.colors.lightGray}`,
    paddingBottom: '0.5rem',
  },
  tabButton: {
    background: 'none',
    border: 'none',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    fontWeight: theme.fontWeights.semiBold,
    color: theme.colors.midGray,
    cursor: 'pointer',
    borderRadius: '8px 8px 0 0',
    transition: 'all 0.2s',
  },
  tabButtonActive: {
    color: theme.colors.maroon,
    backgroundColor: 'rgba(74,4,4,0.05)',
    boxShadow: `inset 0 -3px 0 ${theme.colors.maroon}`,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2.5rem',
  },
  section: {
    background: '#ffffff',
    borderRadius: theme.radii.lg,
    padding: '2.5rem',
    boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
    border: '1px solid rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: '1.35rem',
    color: theme.colors.maroon,
    marginBottom: '0.75rem',
    fontWeight: theme.fontWeights.bold,
  },
  sectionDesc: {
    fontSize: '0.9rem',
    color: theme.colors.midGray,
    marginBottom: '1.5rem',
  },
  profileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.25rem',
  },
  profileItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    background: theme.colors.offWhite,
    padding: '1.25rem',
    borderRadius: theme.radii.md,
    border: '1px solid rgba(0,0,0,0.03)',
  },
  profileLabel: {
    fontSize: '0.8rem',
    color: theme.colors.midGray,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: theme.fontWeights.semiBold,
  },
  profileValue: {
    fontSize: '1.1rem',
    color: theme.colors.charcoal,
    fontWeight: theme.fontWeights.semiBold,
    textTransform: 'capitalize',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    maxWidth: '400px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.95rem',
    fontWeight: theme.fontWeights.semiBold,
    color: theme.colors.charcoal,
    marginBottom: '0.25rem',
  },
  input: {
    padding: '0.85rem',
    borderRadius: theme.radii.md,
    border: '1px solid #E0E0E0',
    background: '#FAFAFA',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  button: {
    padding: '0.85rem 1.5rem',
    background: `linear-gradient(135deg, ${theme.colors.maroon} 0%, ${theme.colors.maroonDark} 100%)`,
    color: theme.colors.white,
    border: 'none',
    borderRadius: theme.radii.full,
    fontSize: '1rem',
    fontWeight: theme.fontWeights.bold,
    cursor: 'pointer',
    marginTop: '1.5rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(74,4,4,0.2)',
  },
  buttonDisabled: {
    background: theme.colors.midGray,
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
  statusAlert: {
    padding: '1rem',
    borderRadius: theme.radii.md,
    fontSize: '0.9rem',
    fontWeight: theme.fontWeights.medium,
  },
  statusSuccess: {
    background: '#E8F5E9',
    color: '#2E7D32',
    border: '1px solid #A5D6A7',
  },
  statusError: {
    background: '#FFEBEE',
    color: '#C62828',
    border: '1px solid #EF9A9A',
  }
};
