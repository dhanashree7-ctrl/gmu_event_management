import React from 'react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../NotificationBell';
import UserProfileDropdown from '../UserProfileDropdown';

// Maps nav ID → human-readable page title
const PAGE_TITLES = {
  Dashboard:           'Dashboard',
  'Action Center':     'Action Center',
  'Approved by me':    'Approved by Me',
  Events:              'My Events',
  'My Events':         'My Events',
  'Registered Events': 'Registered Events',
  Calendar:            'Calendar',
  Archive:             'Event Archive',
  Reports:             'Reports',
  Notifications:       'Notifications',
  Settings:            'Settings',
  Scanner:             'QR Scanner',
  'Configure Routing': 'Configure Approval Routing',
  'Present Routing':   'Present Routing',
};

export default function GlobalHeader({ activeNav, onOpenSettings }) {
  const { user } = useAuth();

  const roleLabel = formatRole(user?.role);
  let pageTitle = PAGE_TITLES[activeNav] ?? (activeNav || 'Dashboard');
  
  if (pageTitle === 'Dashboard' && roleLabel) {
    pageTitle = `${roleLabel} Dashboard`;
  }

  return (
    <header style={styles.header}>
      {/* Left: page title */}
      <div style={styles.headerLeft}>
        <h2 style={styles.pageTitle}>{pageTitle}</h2>
        <p style={styles.pageDate}>
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      {/* Right: notification bell + user pill */}
      <div style={styles.headerRight}>
        <NotificationBell />
        <UserProfileDropdown user={user} onOpenSettings={onOpenSettings} />
      </div>
    </header>
  );
}

function formatRole(role) {
  if (!role) return 'User';
  return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.85rem 2rem',
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
  },
  pageTitle: {
    fontSize: '1.35rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    lineHeight: 1.2,
  },
  pageDate: {
    fontSize: '0.75rem',
    color: '#64748b',
    margin: 0,
    fontWeight: 400,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
};
