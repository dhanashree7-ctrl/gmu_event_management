/**
 * migrate_faculty.js
 * Migrates FacultyDashboard.js from its own inline Sidebar/TopBar
 * to use DashboardLayout (GlobalSidebar + GlobalHeader).
 *
 * Nav ID mapping (old label → new GlobalSidebar id):
 *   'Dashboard'     → 'Dashboard'
 *   'New Request'   → 'Dashboard'   (form shown inside Dashboard tab)
 *   'My Events'     → 'Events'
 *   'Calendar'      → 'Calendar'
 *   'Archive'       → 'Archive'
 *   'Notifications' → 'Notifications'
 *   'Settings'      → 'Settings'
 *   'Reports'       → 'Reports'
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join('C:', 'Event Management', 'frontend', 'src', 'pages', 'FacultyDashboard.js');
let c = fs.readFileSync(FILE, 'utf8');

// ─── 1. Add DashboardLayout import after last existing import ────────────────
if (!c.includes("import DashboardLayout from")) {
  c = c.replace(
    "import DashboardMetrics from '../components/DashboardMetrics';",
    "import DashboardMetrics from '../components/DashboardMetrics';\nimport DashboardLayout from '../components/layout/DashboardLayout';\nimport { FileText, Clock, CheckCircle, CheckSquare, AlertTriangle } from 'lucide-react';"
  );
}

// ─── 2. Remove NotificationBell + UserProfileDropdown imports (now in GlobalHeader) ─
c = c.replace(/import NotificationBell from '\.\.\/components\/NotificationBell';\r?\n/, '');
c = c.replace(/import UserProfileDropdown from '\.\.\/components\/UserProfileDropdown';\r?\n/, '');

// ─── 3. Replace emoji STAT_CARDS ──────────────────────────────────────────────
c = c.replace(
  /const STAT_CARDS = \[[\s\S]*?\];/,
  `const STAT_CARDS = [
  { label: 'Total Submitted', key: 'total',     icon: <FileText   size={22} />, color: '#701a1e' },
  { label: 'Pending Approval',key: 'pending',   icon: <Clock      size={22} />, color: '#C17F24' },
  { label: 'Approved',        key: 'approved',  icon: <CheckCircle size={22} />, color: '#2E7D32' },
  { label: 'Completed',       key: 'completed', icon: <CheckSquare size={22} />, color: '#1565C0' },
];`
);

// ─── 4. Strip emoji from NAV_ITEMS (not used for rendering but keep for backward compat)
const emojiRx = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|\u{1F004}|\u{1F0CF}|[\u{1F170}-\u{1F251}]|\u23F3|\u2705|\u26A0|\uFE0F|\u2795|\u2796|\u2714|\u274C|\u270C|\u{1F44B}|\u26CE|\u2728|\u{1F3C6}/gus;
c = c.replace(emojiRx, '');

// ─── 5. Replace Toast emoji icons with lucide SVGs ────────────────────────────
// Toast isSuccess check replaces the empty leftover emoji spans
c = c.replace(
  /<span style=\{styles\.toastIcon\}>\s*<\/span>/g,
  '<span style={styles.toastIcon}>{isSuccess ? <CheckCircle size={15} color="#1B5E20" /> : <AlertTriangle size={15} color="#B71C1C" />}</span>'
);
// Also handle if it still has text content
c = c.replace(
  /<span style=\{styles\.toastIcon\}>[^<]*<\/span>/g,
  '<span style={styles.toastIcon}>{isSuccess ? <CheckCircle size={15} color="#1B5E20" /> : <AlertTriangle size={15} color="#B71C1C" />}</span>'
);

// ─── 6. Remove inline Sidebar sub-component ───────────────────────────────────
// Sidebar runs from "/** Sidebar navigation */" to closing "}\n\n/** Stat card"
const sidebarStart = c.indexOf('/** Sidebar navigation */');
const statCardStart = c.indexOf('/** Stat card widget */');
if (sidebarStart !== -1 && statCardStart !== -1) {
  c = c.substring(0, sidebarStart) + c.substring(statCardStart);
}

// ─── 7. Remove collapsed state (DashboardLayout manages it now) ───────────────
c = c.replace(/\s*\/\/ Layout state\r?\n\s*const \[collapsed, setCollapsed\] = useState\(false\);\r?\n/, '\n');

// ─── 8. Replace main return block: strip old Sidebar + topbar, wrap in DashboardLayout ─
// Target: from return ( <div style={styles.root}> ... <div style={styles.content}>
// Replace with: return ( <DashboardLayout ... > <>
const oldReturnStart = `  return (\r\n    <div style={styles.root}>\r\n\r\n      {/* ── Sidebar ─────────────────────────────────────────── */}\r\n      <Sidebar user={user} onLogout={handleLogout} collapsed={collapsed} activeNav={activeNav} setActiveNav={setActiveNav} />\r\n\r\n      {/* ── Main area ───────────────────────────────────────── */}\r\n      <div style={styles.main}>\r\n\r\n        {/* ── Top bar ───────────────────────────────────────── */}\r\n        <header style={styles.topBar}>\r\n          {/* Hamburger to toggle sidebar */}\r\n          <button\r\n            style={styles.collapseBtn}\r\n            onClick={() => setCollapsed((c) => !c)}\r\n            aria-label="Toggle sidebar"\r\n          >\r\n            {collapsed ? '→' : '←'}\r\n          </button>\r\n\r\n          <div style={styles.topBarCenter}>\r\n            <h1 style={styles.topBarTitle}>Faculty Dashboard</h1>\r\n            <p style={styles.topBarSub}>\r\n              {new Date().toLocaleDateString('en-IN', {\r\n                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',\r\n              })}\r\n            </p>\r\n          </div>\r\n\r\n          {/* Notification Bell + User pill */}\r\n          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>\r\n            <NotificationBell />\r\n            <UserProfileDropdown user={user} />\r\n          </div>\r\n        </header>\r\n\r\n        {/* ── Scrollable content ────────────────────────────── */}\r\n        <div style={styles.content}>`;

const newReturnStart = `  return (\r\n    <DashboardLayout role="faculty" activeNav={activeNav} onNavChange={setActiveNav}>\r\n      <>`;

if (c.includes(oldReturnStart)) {
  c = c.replace(oldReturnStart, newReturnStart);
  console.log('✓ Replaced return/Sidebar/topbar block');
} else {
  console.log('⚠ Could not find exact return block — trying fallback...');
  // Fallback: find by regex
  const m = c.match(/return \(\r?\n\s*<div style=\{styles\.root\}>/);
  if (m) {
    const startIdx = m.index;
    // Find end of topbar: </header> then the content div opening
    const contentDivMarker = '<div style={styles.content}>';
    const contentDivIdx = c.indexOf(contentDivMarker, startIdx);
    if (contentDivIdx !== -1) {
      const endIdx = contentDivIdx + contentDivMarker.length;
      c = c.substring(0, startIdx)
        + `  return (\n    <DashboardLayout role="faculty" activeNav={activeNav} onNavChange={setActiveNav}>\n      <>`
        + c.substring(endIdx);
      console.log('✓ Fallback replacement succeeded');
    }
  }
}

// ─── 9. Fix the closing tags of the main component ─────────────────────────
// Old closing: </div>\n        </div>\n    </div>\n  );
// New closing: </>\n    </DashboardLayout>\n  );
// The main content div closed before the modals, then </div> (main), then </div> (root)
// Pattern to find the end of the scrollable content div before the first modal:
const oldContentClose = `        </div>\r\n      </div>\r\n    </div>\r\n  );`;
const newContentClose = `      </>\r\n    </DashboardLayout>\r\n  );`;

if (c.includes(oldContentClose)) {
  // Replace only the LAST occurrence (main component closing, not a nested one)
  const lastIdx = c.lastIndexOf(oldContentClose);
  c = c.substring(0, lastIdx) + newContentClose + c.substring(lastIdx + oldContentClose.length);
  console.log('✓ Fixed closing tags');
} else {
  // Try LF version
  const oldLF = `        </div>\n      </div>\n    </div>\n  );`;
  const newLF = `      </>\n    </DashboardLayout>\n  );`;
  const lastIdx = c.lastIndexOf(oldLF);
  if (lastIdx !== -1) {
    c = c.substring(0, lastIdx) + newLF + c.substring(lastIdx + oldLF.length);
    console.log('✓ Fixed closing tags (LF version)');
  } else {
    console.log('⚠ Could not fix closing tags automatically — manual review needed');
  }
}

// ─── 10. Update 'New Request' nav references to show inside Dashboard ─────────
// FacultyDashboard uses activeNav === 'New Request' for the form — keep that working
// but map My Events → Events for GlobalSidebar consistency
c = c.replace(/activeNav === 'My Events'/g, "activeNav === 'Events'");

// ─── 11. Strip any remaining emoji sequences ──────────────────────────────────
const emojiRx2 = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]/gus;
c = c.replace(emojiRx2, '');

// ─── Write ────────────────────────────────────────────────────────────────────
fs.writeFileSync(FILE, c);
console.log('✅ FacultyDashboard migration complete');
