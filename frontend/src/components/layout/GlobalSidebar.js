import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  Bell, 
  Archive, 
  FileText,
  ClipboardList,
  CheckSquare,
  Route,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Ticket,
  PlusSquare,
  Shield,
  UserCheck
} from 'lucide-react';
import theme from '../../theme';

const ROLE_NAV_CONFIG = {
  faculty: [
    { label: 'Dashboard', icon: LayoutDashboard, id: 'Dashboard' },
    { label: 'Events', icon: Ticket, id: 'Events' },
    { label: 'Scanner', icon: UserCheck, id: 'Scanner' },
    { label: 'Calendar', icon: Calendar, id: 'Calendar' },
    { label: 'Archive', icon: Archive, id: 'Archive' },
    { label: 'Reports', icon: FileText, id: 'Reports' },
    { label: 'Notifications', icon: Bell, id: 'Notifications' },
    { label: 'Settings', icon: Settings, id: 'Settings' }
  ],
  events_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, id: 'Dashboard' },
    { label: 'Action Center', icon: CheckSquare, id: 'Action Center' },
    { label: 'Events', icon: Ticket, id: 'Events' },
    { label: 'Configure Routing', icon: Route, id: 'Configure Routing' },
    { label: 'Present Routing', icon: Route, id: 'Present Routing' },
    { label: 'Scanner', icon: UserCheck, id: 'Scanner' },
    { label: 'Calendar', icon: Calendar, id: 'Calendar' },
    { label: 'Archive', icon: Archive, id: 'Archive' },
    { label: 'Reports', icon: FileText, id: 'Reports' },
    { label: 'Notifications', icon: Bell, id: 'Notifications' },
    { label: 'Settings', icon: Settings, id: 'Settings' }
  ],
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, id: 'Dashboard' },
    { label: 'Events', icon: Ticket, id: 'Events' },
    { label: 'Scanner', icon: UserCheck, id: 'Scanner' },
    { label: 'Calendar', icon: Calendar, id: 'Calendar' },
    { label: 'Reports', icon: FileText, id: 'Reports' },
    { label: 'Notifications', icon: Bell, id: 'Notifications' },
    { label: 'Settings', icon: Settings, id: 'Settings' }
  ],
  volunteer: [
    { label: 'Scanner', icon: UserCheck, id: 'Scanner' }
  ]
};

const DEFAULT_APPROVER_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, id: 'Dashboard' },
  { label: 'Action Center', icon: CheckSquare, id: 'Action Center' },
  { label: 'Events', icon: Ticket, id: 'Events' },
  { label: 'Scanner', icon: UserCheck, id: 'Scanner' },
  { label: 'Calendar', icon: Calendar, id: 'Calendar' },
  { label: 'Archive', icon: Archive, id: 'Archive' },
  { label: 'Reports', icon: FileText, id: 'Reports' },
  { label: 'Notifications', icon: Bell, id: 'Notifications' },
  { label: 'Settings', icon: Settings, id: 'Settings' }
];

// Inject global CSS for hover transitions once
if (typeof document !== 'undefined' && !document.getElementById('gmu-sidebar-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'gmu-sidebar-styles';
  styleEl.textContent = `
    .gmu-nav-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 1rem;
      cursor: pointer;
      transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
      color: rgba(255,255,255,0.62);
      margin: 0 0.5rem;
      border-radius: 10px;
      border-left: 3px solid transparent;
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: 0.01em;
    }
    .gmu-nav-item:hover {
      color: #fff;
      background: rgba(253,208,111,0.09);
      border-left-color: rgba(253,208,111,0.45);
      transform: translateX(4px);
    }
    .gmu-nav-item:active {
      transform: translateX(2px) scale(0.98);
      background: rgba(253,208,111,0.13);
    }
    .gmu-nav-item.gmu-active {
      color: #FDD06F;
      background: rgba(253,208,111,0.13);
      border-left-color: #FDD06F;
      font-weight: 600;
    }
    .gmu-nav-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 8px;
      transition: all 0.22s ease;
      flex-shrink: 0;
    }
    .gmu-nav-item:hover .gmu-nav-icon {
      background: rgba(253,208,111,0.14);
      color: #FDD06F;
    }
    .gmu-nav-item.gmu-active .gmu-nav-icon {
      background: rgba(253,208,111,0.18);
      color: #FDD06F;
    }
    .gmu-toggle-btn:hover {
      background: #8a2126 !important;
      border-color: rgba(253,208,111,0.65) !important;
      box-shadow: 0 0 0 3px rgba(253,208,111,0.15) !important;
      transform: scale(1.1);
    }
    .gmu-logout-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      padding: 0.6rem 0.9rem;
      border-radius: 10px;
      transition: all 0.22s ease;
      border: 1px solid rgba(253,208,111,0.14);
    }
    .gmu-logout-btn:hover {
      background: rgba(253,208,111,0.1);
      border-color: rgba(253,208,111,0.35);
      transform: translateX(3px);
    }
    .gmu-logout-btn:active {
      transform: translateX(1px) scale(0.98);
    }
    .gmu-logo-crest {
      transition: transform 0.3s ease;
      display: inline-block;
    }
    .gmu-logo-area:hover .gmu-logo-crest {
      transform: rotate(-6deg) scale(1.08);
    }
    .gmu-sidebar-nav::-webkit-scrollbar { width: 0; }
  `;
  document.head.appendChild(styleEl);
}

export default function GlobalSidebar({ role, activeNav, onNavChange, collapsed, setCollapsed }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  let navItems = ROLE_NAV_CONFIG[role] || DEFAULT_APPROVER_NAV;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <aside style={{
      ...styles.sidebar,
      width: collapsed ? '4.5rem' : '15.5rem',
    }}>
      
      {/* ── Toggle Button ── */}
      <button 
        className="gmu-toggle-btn"
        style={styles.toggleBtn} 
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* ── Logo ── */}
      <div className="gmu-logo-area" style={{
        ...styles.sidebarLogo,
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '1.25rem 0' : '1.25rem 1.25rem',
      }}>
        <span className="gmu-logo-crest" style={{ fontSize: '1.8rem', color: '#FDD06F', flexShrink: 0, lineHeight: 1 }}></span>
        {!collapsed && (
          <div>
            <p style={styles.sidebarLogoName}>GM University</p>
            <p style={styles.sidebarLogoSub}>Event System</p>
          </div>
        )}
      </div>

      {/* ── Role Pill ── */}
      {!collapsed && role && (
        <div style={styles.rolePill}>
          <span style={styles.rolePillDot} />
          <span style={styles.rolePillText}>{formatRole(role)}</span>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="gmu-sidebar-nav" style={styles.sidebarNav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id || activeNav === item.label;
          return (
            <div 
              key={item.label}
              className={`gmu-nav-item${isActive ? ' gmu-active' : ''}`}
              style={collapsed ? { justifyContent: 'center', margin: '0 0.4rem', padding: '0.65rem 0' } : {}}
              onClick={() => onNavChange(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <div className="gmu-nav-icon">
                <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              {!collapsed && (
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                  {item.label}
                </span>
              )}
              {isActive && collapsed && (
                <span style={{
                  position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)',
                  width: '4px', height: '4px', borderRadius: '50%', background: '#FDD06F',
                  boxShadow: '0 0 5px rgba(253,208,111,0.8)',
                }} />
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={styles.sidebarFooter}>
        <div 
          className="gmu-logout-btn"
          style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={17} color="#FDD06F" strokeWidth={2} />
          {!collapsed && <span style={styles.logoutText}>Logout</span>}
        </div>
      </div>
    </aside>
  );
}

function formatRole(role) {
  if (!role) return '';
  return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const styles = {
  sidebar: {
    backgroundColor: '#6b1519',
    backgroundImage: 'linear-gradient(180deg, #701a1e 0%, #5a1115 100%)',
    color: '#fff',
    flexShrink: 0,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
    borderRight: '1px solid rgba(253,208,111,0.1)',
    boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
    overflow: 'hidden',
  },
  toggleBtn: {
    position: 'absolute',
    top: '20px',
    right: '-12px',
    width: '24px',
    height: '24px',
    backgroundColor: '#701a1e',
    color: '#FDD06F',
    border: '1.5px solid rgba(253,208,111,0.3)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 50,
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    transition: 'all 0.2s ease',
  },
  sidebarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.7rem',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    minHeight: '68px',
  },
  sidebarLogoName: {
    fontFamily: '"Inter", sans-serif',
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#FDD06F',
    lineHeight: 1.1,
    margin: 0,
  },
  sidebarLogoSub: {
    fontSize: '0.58rem',
    color: 'rgba(253,208,111,0.58)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    margin: '2px 0 0',
  },
  rolePill: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    margin: '0.6rem 1rem',
    padding: '0.28rem 0.7rem',
    background: 'rgba(253,208,111,0.07)',
    border: '1px solid rgba(253,208,111,0.13)',
    borderRadius: '20px',
    width: 'fit-content',
  },
  rolePillDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#4ade80',
    boxShadow: '0 0 6px rgba(74,222,128,0.7)',
    flexShrink: 0,
  },
  rolePillText: {
    fontSize: '0.62rem',
    color: 'rgba(253,208,111,0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
  },
  sidebarNav: {
    flex: 1,
    padding: '0.6rem 0',
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
  },
  sidebarFooter: {
    padding: '0.65rem 0.65rem',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  logoutText: {
    color: '#FDD06F',
    fontWeight: '600',
    fontSize: '0.875rem',
    whiteSpace: 'nowrap',
  },
};


