import React, { useState, useEffect } from 'react';
import GlobalSidebar from './GlobalSidebar';
import GlobalHeader from './GlobalHeader';

/**
 * DashboardLayout
 * ─────────────────────────────────────────────────────────────────
 * Provides the global fixed viewport structure:
 *   [Sidebar fixed 100vh] [Main: Header sticky + Content scrollable]
 *
 * Props:
 *   role       — DB role string (e.g. "faculty", "hod", "vc")
 *   activeNav  — current nav item id string
 *   onNavChange — callback when nav item is clicked
 *   children   — the page content to render inside the scrollable area
 *
 * Mobile behaviour:
 *   ≤ 768px — sidebar hides off-screen; hamburger in header slides it in as a drawer
 *   > 768px — original collapsible sidebar behaviour
 */
export default function DashboardLayout({ children, role, activeNav, onNavChange, onOpenSettings }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect breakpoint changes
  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false); // close drawer when resizing to desktop
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Close mobile drawer when nav changes
  const handleNavChange = (id) => {
    onNavChange(id);
    if (isMobile) setMobileOpen(false);
  };

  return (
    <div style={styles.root}>
      {/* ── Mobile backdrop overlay ── */}
      {isMobile && mobileOpen && (
        <div
          style={styles.mobileBackdrop}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Fixed Sidebar ── */}
      <GlobalSidebar
        role={role}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        collapsed={isMobile ? false : collapsed}
        setCollapsed={setCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* ── Right Side: Header + Scrollable Content ── */}
      <div style={styles.mainArea}>
        {/* Sticky header — shows page title derived from activeNav */}
        <GlobalHeader
          activeNav={activeNav}
          onOpenSettings={onOpenSettings}
          isMobile={isMobile}
          onHamburgerClick={() => setMobileOpen(true)}
        />

        {/* Scrollable content area — ONLY this scrolls */}
        <div style={{ ...styles.contentWrapper, padding: isMobile ? '1rem' : '1.5rem 2rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',     // Body never scrolls
    backgroundColor: '#f8fafc',
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    position: 'relative',
  },
  mainArea: {
    flex: 1,
    minWidth: 0,            // Prevent flex overflow
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',     // Contain the inner scroll
    backgroundColor: '#f8fafc',
  },
  contentWrapper: {
    flex: 1,
    overflowY: 'auto',      // ONLY this region scrolls
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    minHeight: 0,           // Allow flex children to compress
  },
  mobileBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    backdropFilter: 'blur(2px)',
    zIndex: 199,            // Just below sidebar z-index (200)
    touchAction: 'none',
  },
};
