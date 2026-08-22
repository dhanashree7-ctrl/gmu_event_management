import React, { useState } from 'react';
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
 */
export default function DashboardLayout({ children, role, activeNav, onNavChange, onOpenSettings }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={styles.root}>
      {/* ── Fixed Sidebar ── */}
      <GlobalSidebar
        role={role}
        activeNav={activeNav}
        onNavChange={onNavChange}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* ── Right Side: Header + Scrollable Content ── */}
      <div style={styles.mainArea}>
        {/* Sticky header — shows page title derived from activeNav */}
        <GlobalHeader activeNav={activeNav} onOpenSettings={onOpenSettings} />

        {/* Scrollable content area — ONLY this scrolls */}
        <div style={styles.contentWrapper}>
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
    padding: '1.5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    minHeight: 0,           // Allow flex children to compress
  },
};
