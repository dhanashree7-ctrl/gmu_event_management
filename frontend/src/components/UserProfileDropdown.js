import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';

const s = (...styles) => Object.assign({}, ...styles.filter(Boolean));

export default function UserProfileDropdown({ user, onOpenSettings }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const formattedRole = user.role 
    ? user.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '';

  return (
    <div ref={dropdownRef} style={{ position: 'relative', zIndex: 9999 }}>
      <div 
        style={styles.topBarUser} 
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={styles.topBarAvatar}>
          {user.name?.charAt(0).toUpperCase()}
        </div>
        <div style={styles.topBarUserInfo}>
          <div style={styles.topBarUserName}>{user.name}</div>
          <div style={styles.topBarUserRole}>
            {formattedRole}{user.department_name ? ` - ${user.department_name}` : ''}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="user-profile-dropdown" style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <div style={{ fontWeight: 700, color: '#333' }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
              {formattedRole} {user.department_name ? `- ${user.department_name}` : ''}
            </div>
          </div>
          <button 
            style={styles.menuItem} 
            onClick={() => {
              setIsOpen(false);
              if (onOpenSettings) onOpenSettings();
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ marginRight: '8px' }}>️</span> Settings
          </button>
          <div style={styles.divider} />
          <button 
            style={s(styles.menuItem, { color: '#E53935' })} 
            onClick={() => {
              setIsOpen(false);
              logout();
              navigate('/login');
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF0F0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ marginRight: '8px' }}></span> Log Out
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  topBarUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    cursor: 'pointer',
    padding: '6px 10px',
    borderRadius: '8px',
    transition: 'background 0.2s',
  },
  topBarAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: theme.colors.maroon,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '1rem',
    boxShadow: '0 2px 5px rgba(74,4,4,0.2)',
  },
  topBarUserInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  topBarUserName: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: theme.colors.charcoal,
    lineHeight: 1.2,
  },
  topBarUserRole: {
    fontSize: '0.75rem',
    color: theme.colors.midGray,
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    right: '0',
    width: '220px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
    border: '1px solid #E0E0E0',
    overflow: 'hidden',
    animation: 'slideDown 0.2s ease-out forwards',
  },
  dropdownHeader: {
    padding: '1rem',
    background: '#FAFAFA',
    borderBottom: '1px solid #E0E0E0',
  },
  divider: {
    height: '1px',
    background: '#F0F0F0',
    margin: '0',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '0.85rem 1rem',
    background: 'transparent',
    border: 'none',
    textAlign: 'left',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#333',
    cursor: 'pointer',
    transition: 'background 0.2s',
  }
};
