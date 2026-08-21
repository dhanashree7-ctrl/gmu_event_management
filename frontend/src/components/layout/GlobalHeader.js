import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../NotificationBell';
import UserProfileDropdown from '../UserProfileDropdown';

export default function GlobalHeader() {
  const { user } = useAuth();

  return (
    <header style={styles.header}>
      <div style={styles.headerLeft}>
        <h2 style={styles.pageTitle}>
          {user?.role ? `${formatRole(user.role)} Dashboard` : 'Dashboard'}
        </h2>
      </div>
      
      <div style={styles.headerRight}>
        <NotificationBell />
        <UserProfileDropdown user={user} />
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
    padding: '1.5rem 2.5rem',
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerLeft: {},
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  notificationWrapper: {
    position: 'relative',
    cursor: 'pointer',
    padding: '0.6rem',
    borderRadius: '50%',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
  },
  notificationHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    backgroundColor: '#f8fafc',
  },
  notificationDropdown: {
    position: 'absolute',
    top: '120%',
    right: 0,
    width: '280px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    zIndex: 50,
    animation: 'fadeSlideDown 0.2s ease',
  },
  notificationHeader: {
    padding: '1rem',
    borderBottom: '1px solid #e2e8f0',
    fontWeight: 'bold',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  notificationBody: {
    padding: '1.5rem 1rem',
    color: '#64748b',
    fontSize: '0.9rem',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'pointer',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  userRole: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#701a1e',
    color: '#FDD06F',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1rem',
  }
};
