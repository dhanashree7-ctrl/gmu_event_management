import React, { useState } from 'react';
import GlobalSidebar from './GlobalSidebar';
import GlobalHeader from './GlobalHeader';

/**
 * DashboardLayout
 * Provides the global fixed H/W structure, the sticky sidebar,
 * and the scrolling main content area for ALL dashboard roles.
 */
export default function DashboardLayout({ children, role, activeNav, onNavChange }) {
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

      {/* ── Scrollable Main Content Area ── */}
      <div style={styles.mainArea}>
        <GlobalHeader />
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
    overflow: 'hidden', // Zero scroll on body
    backgroundColor: '#f8fafc',
    fontFamily: '"Inter", sans-serif',
  },
  mainArea: {
    flex: 1,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    backgroundColor: '#f8fafc',
    overflow: 'hidden', // Stop double scrollbars
  },
  contentWrapper: {
    flex: 1,
    padding: '1.5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    overflowY: 'auto', // Only scroll inside content if necessary
    height: 'calc(100vh - 4rem)', // clamp
  },
};
