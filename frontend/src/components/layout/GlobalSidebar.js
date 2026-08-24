import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Settings,
  Bell,
  Archive,
  FileText,
  CheckSquare,
  ClipboardCheck,
  Route,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Ticket,
  UserCheck,
  ScanLine,
  ListChecks,
  Users,
  PlusCircle,
  X,
} from 'lucide-react';
import theme from '../../theme';

// ── Role alias map ─────────────────────────────────────────────────────────
// Maps exact DB role strings → config key used in ROLE_NAV_CONFIG
const ROLE_ALIAS = {
  faculty:        'faculty',
  organiser:      'faculty',
  organizer:      'faculty',
  hod:            'hod',
  director:       'executive',
  dean:           'executive',
  provc:          'executive',
  pro_vc:         'executive',
  vc:             'executive',
  student_affairs:'student_affairs',
  events_admin:   'events_admin',
  admin:          'events_admin',
  student:        'student',
  volunteer:      'volunteer',
};

// ── Role-based nav configs ─────────────────────────────────────────────────
const ROLE_NAV_CONFIG = {
  faculty: [
    { label: 'Dashboard',      icon: LayoutDashboard, id: 'Dashboard' },
    { label: 'My Events',      icon: Ticket,          id: 'Events' },
    { label: 'Calendar',       icon: Calendar,        id: 'Calendar' },
    { label: 'Archive',        icon: Archive,         id: 'Archive' },
    { label: 'Reports',        icon: FileText,        id: 'Reports' },
    { label: 'Notifications',  icon: Bell,            id: 'Notifications' },
    { label: 'Settings',       icon: Settings,        id: 'Settings' },
  ],
  hod: [
    { label: 'Dashboard',      icon: LayoutDashboard, id: 'Dashboard' },
    { label: 'Action Center',  icon: CheckSquare,     id: 'Action Center' },
    { label: 'Approved by me', icon: ClipboardCheck,  id: 'Approved by me' },
    { label: 'My Events',      icon: Ticket,          id: 'Events' },
    { label: 'Calendar',       icon: Calendar,        id: 'Calendar' },
    { label: 'Archive',        icon: Archive,         id: 'Archive' },
    { label: 'Reports',        icon: FileText,        id: 'Reports' },
    { label: 'Notifications',  icon: Bell,            id: 'Notifications' },
    { label: 'Settings',       icon: Settings,        id: 'Settings' },
  ],
  executive: [
    { label: 'Dashboard',      icon: LayoutDashboard, id: 'Dashboard' },
    { label: 'Action Center',  icon: CheckSquare,     id: 'Action Center' },
    { label: 'Approved by me', icon: ClipboardCheck,  id: 'Approved by me' },
    { label: 'My Events',      icon: Ticket,          id: 'Events' },
    { label: 'Calendar',       icon: Calendar,        id: 'Calendar' },
    { label: 'Archive',        icon: Archive,         id: 'Archive' },
    { label: 'Reports',        icon: FileText,        id: 'Reports' },
    { label: 'Notifications',  icon: Bell,            id: 'Notifications' },
    { label: 'Settings',       icon: Settings,        id: 'Settings' },
  ],
  student_affairs: [
    { label: 'Dashboard',      icon: LayoutDashboard, id: 'Dashboard' },
    { label: 'Action Center',  icon: CheckSquare,     id: 'Action Center' },
    { label: 'Approved by me', icon: ClipboardCheck,  id: 'Approved by me' },
    { label: 'My Events',      icon: Ticket,          id: 'Events' },
    { label: 'Calendar',       icon: Calendar,        id: 'Calendar' },
    { label: 'Archive',        icon: Archive,         id: 'Archive' },
    { label: 'Reports',        icon: FileText,        id: 'Reports' },
    { label: 'Notifications',  icon: Bell,            id: 'Notifications' },
    { label: 'Settings',       icon: Settings,        id: 'Settings' },
  ],
  events_admin: [
    { label: 'Dashboard',           icon: LayoutDashboard, id: 'Dashboard' },
    { label: 'Current Routings',    icon: ListChecks,      id: 'Current Routings' },
    { label: 'Configure Routing',   icon: Route,           id: 'Configure Routing' },
    { label: 'Manage Users',        icon: Users,           id: 'Manage Users' },
    { label: 'Archive',             icon: Archive,         id: 'Archive' },
    { label: 'Reports & Analytics', icon: FileText,        id: 'Reports & Analytics' },
    { label: 'Settings',            icon: Settings,        id: 'Settings' },
  ],
  student: [
    { label: 'Dashboard',      icon: LayoutDashboard, id: 'Dashboard' },
    { label: 'My Events',      icon: CalendarCheck,   id: 'Events' },
    { label: 'Calendar',       icon: Calendar,        id: 'Calendar' },
    { label: 'Notifications',  icon: Bell,            id: 'Notifications' },
    { label: 'Settings',       icon: Settings,        id: 'Settings' },
  ],
  volunteer: [
    { label: 'Scanner', icon: ScanLine, id: 'Scanner' },
  ],
};

// ── Global CSS injection ───────────────────────────────────────────────────
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
    .gmu-nav-item-collapsed {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.65rem 0;
      margin: 0 0.4rem;
      cursor: pointer;
      transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
      color: rgba(255,255,255,0.62);
      border-radius: 10px;
      border-left: 3px solid transparent;
    }
    .gmu-nav-item-collapsed:hover {
      color: #fff;
      background: rgba(253,208,111,0.09);
      border-left-color: rgba(253,208,111,0.45);
    }
    .gmu-nav-item-collapsed.gmu-active {
      color: #FDD06F;
      background: rgba(253,208,111,0.13);
      border-left-color: #FDD06F;
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
    .gmu-nav-item:hover .gmu-nav-icon,
    .gmu-nav-item-collapsed:hover .gmu-nav-icon {
      background: rgba(253,208,111,0.14);
      color: #FDD06F;
    }
    .gmu-nav-item.gmu-active .gmu-nav-icon,
    .gmu-nav-item-collapsed.gmu-active .gmu-nav-icon {
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
    .gmu-logout-btn:active { transform: translateX(1px) scale(0.98); }
    .gmu-logo-crest { transition: transform 0.3s ease; display: inline-block; }
    .gmu-logo-area:hover .gmu-logo-crest { transform: rotate(-6deg) scale(1.08); }
    .gmu-sidebar-nav::-webkit-scrollbar { width: 0; }
    /* Tooltip for collapsed mode */
    .gmu-tooltip {
      position: absolute;
      left: calc(100% + 12px);
      top: 50%;
      transform: translateY(-50%);
      background: #1e293b;
      color: #fff;
      font-size: 0.78rem;
      font-weight: 500;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .gmu-tooltip::before {
      content: '';
      position: absolute;
      right: 100%;
      top: 50%;
      transform: translateY(-50%);
      border: 5px solid transparent;
      border-right-color: #1e293b;
    }
    .gmu-nav-item-collapsed:hover .gmu-tooltip { opacity: 1; }

    /* Mobile sidebar drawer animation */
    .gmu-sidebar-mobile {
      transform: translateX(-100%);
      transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    .gmu-sidebar-mobile.gmu-sidebar-mobile-open {
      transform: translateX(0);
    }
  `;
  document.head.appendChild(styleEl);
}

// ── Component ──────────────────────────────────────────────────────────────
export default function GlobalSidebar({ role, activeNav, onNavChange, collapsed, setCollapsed, isMobile, mobileOpen, setMobileOpen }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Resolve role alias → nav config key
  const configKey = ROLE_ALIAS[role] || 'faculty';
  const navItems = ROLE_NAV_CONFIG[configKey] || ROLE_NAV_CONFIG.faculty;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  // On mobile: render as absolute drawer. On desktop: render as fixed flex sidebar.
  if (isMobile) {
    return (
      <aside
        className={`gmu-sidebar-mobile${mobileOpen ? ' gmu-sidebar-mobile-open' : ''}`}
        style={styles.mobileDrawer}
      >
        {/* Close button */}
        <button
          style={{ ...styles.mobileCloseBtn, zIndex: 99999 }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMobileOpen(false); }}
          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setMobileOpen(false); }}
          onPointerDown={(e) => { e.stopPropagation(); }}
          aria-label="Close menu"
          type="button"
        >
          <X size={20} />
        </button>

        {/* ── Logo / Brand ── */}
        <div className="gmu-logo-area" style={{ ...styles.sidebarLogo, justifyContent: 'flex-start', padding: '1.25rem 1.25rem' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="gmu-logo-crest" style={{ flexShrink: 0 }}>
            <path d="M14 2L3 7v7c0 6.08 4.66 11.76 11 13 6.34-1.24 11-6.92 11-13V7L14 2z" fill="#FDD06F" opacity="0.18" />
            <path d="M14 2L3 7v7c0 6.08 4.66 11.76 11 13 6.34-1.24 11-6.92 11-13V7L14 2z" stroke="#FDD06F" strokeWidth="1.5" strokeLinejoin="round" />
            <text x="14" y="17" textAnchor="middle" fill="#FDD06F" fontSize="8" fontWeight="bold" fontFamily="serif">GM</text>
          </svg>
          <div>
            <p style={styles.sidebarLogoName}>GM University</p>
            <p style={styles.sidebarLogoSub}>Event System</p>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="gmu-sidebar-nav" style={styles.sidebarNav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id || activeNav === item.label;
            return (
              <div
                key={item.id}
                className={`gmu-nav-item${isActive ? ' gmu-active' : ''}`}
                onClick={() => onNavChange(item.id)}
              >
                <div className="gmu-nav-icon">
                  <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </nav>

        {/* ── Footer — logout ── */}
        <div style={styles.sidebarFooter}>
          <div
            className="gmu-logout-btn"
            style={{ justifyContent: 'flex-start' }}
            onClick={handleLogout}
            role="button"
            aria-label="Logout"
          >
            <LogOut size={17} color="#FDD06F" strokeWidth={2} />
            <span style={styles.logoutText}>Logout</span>
          </div>
        </div>
      </aside>
    );
  }

  // ── Desktop sidebar ──────────────────────────────────────────────────────
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
        aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* ── Logo / Brand ── */}
      <div className="gmu-logo-area" style={{
        ...styles.sidebarLogo,
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '1.25rem 0' : '1.25rem 1.25rem',
      }}>
        {/* University crest using SVG shield — no emoji */}
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="gmu-logo-crest" style={{ flexShrink: 0 }}>
          <path d="M14 2L3 7v7c0 6.08 4.66 11.76 11 13 6.34-1.24 11-6.92 11-13V7L14 2z" fill="#FDD06F" opacity="0.18" />
          <path d="M14 2L3 7v7c0 6.08 4.66 11.76 11 13 6.34-1.24 11-6.92 11-13V7L14 2z" stroke="#FDD06F" strokeWidth="1.5" strokeLinejoin="round" />
          <text x="14" y="17" textAnchor="middle" fill="#FDD06F" fontSize="8" fontWeight="bold" fontFamily="serif">GM</text>
        </svg>
        {!collapsed && (
          <div>
            <p style={styles.sidebarLogoName}>GM University</p>
            <p style={styles.sidebarLogoSub}>Event System</p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="gmu-sidebar-nav" style={styles.sidebarNav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id || activeNav === item.label;

          if (collapsed) {
            return (
              <div
                key={item.id}
                className={`gmu-nav-item-collapsed${isActive ? ' gmu-active' : ''}`}
                onClick={() => onNavChange(item.id)}
              >
                <div className="gmu-nav-icon">
                  <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                {/* Active dot */}
                {isActive && (
                  <span style={{
                    position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)',
                    width: '4px', height: '4px', borderRadius: '50%', background: '#FDD06F',
                    boxShadow: '0 0 5px rgba(253,208,111,0.8)',
                  }} />
                )}
                {/* Tooltip */}
                <span className="gmu-tooltip">{item.label}</span>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className={`gmu-nav-item${isActive ? ' gmu-active' : ''}`}
              onClick={() => onNavChange(item.id)}
            >
              <div className="gmu-nav-icon">
                <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </nav>

      {/* ── Footer — brand + logout only ── */}
      <div style={styles.sidebarFooter}>
        <div
          className="gmu-logout-btn"
          style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          role="button"
          aria-label="Logout"
        >
          <LogOut size={17} color="#FDD06F" strokeWidth={2} />
          {!collapsed && <span style={styles.logoutText}>Logout</span>}
        </div>
      </div>
    </aside>
  );
}

function formatRole(key) {
  if (!key) return '';
  return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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
    overflow: 'visible',
    zIndex: 100,
  },
  // Mobile: slides in as a fixed overlay drawer from the left
  mobileDrawer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '15.5rem',
    height: '100vh',
    backgroundColor: '#6b1519',
    backgroundImage: 'linear-gradient(180deg, #701a1e 0%, #5a1115 100%)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 200,
    boxShadow: '4px 0 32px rgba(0,0,0,0.35)',
    borderRight: '1px solid rgba(253,208,111,0.1)',
    overflowY: 'auto',
  },
  mobileCloseBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'rgba(255,255,255,0.2)',
    border: '2px solid rgba(255,255,255,0.4)',
    borderRadius: '12px',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#FDD06F',
    zIndex: 99999,
  },
  toggleBtn: {
    position: 'absolute',
    top: '20px',
    right: '-14px',
    width: '28px',
    height: '28px',
    backgroundColor: '#701a1e',
    color: '#FDD06F',
    border: '2px solid rgba(253,208,111,0.6)',
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
    padding: '0.65rem',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  logoutText: {
    color: '#FDD06F',
    fontWeight: '600',
    fontSize: '0.875rem',
    whiteSpace: 'nowrap',
  },
};
