/**
 * migrate_student_affairs.js
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join('C:', 'Event Management', 'frontend', 'src', 'pages', 'StudentAffairsDashboard.js');
let c = fs.readFileSync(FILE, 'utf8');

// ─── 1. Add DashboardLayout import ─────────────────────────────────────────
if (!c.includes("import DashboardLayout from")) {
  c = c.replace(
    "import DashboardMetrics from '../components/DashboardMetrics';",
    "import DashboardMetrics from '../components/DashboardMetrics';\nimport DashboardLayout from '../components/layout/DashboardLayout';\nimport { FileText, Clock, CheckCircle, CheckSquare, AlertTriangle } from 'lucide-react';"
  );
}

// ─── 2. Remove NotificationBell + UserProfileDropdown imports ─────────────
c = c.replace(/import NotificationBell from '\.\.\/components\/NotificationBell';\r?\n/, '');
c = c.replace(/import UserProfileDropdown from '\.\.\/components\/UserProfileDropdown';\r?\n/, '');

// ─── 3. Replace emoji STAT_CARDS ──────────────────────────────────────────
c = c.replace(
  /const STAT_CARDS = \[[\s\S]*?\];/,
  `const STAT_CARDS = [
  { label: 'Total Submitted', key: 'total',     icon: <FileText   size={22} />, color: '#701a1e' },
  { label: 'Pending Approval',key: 'pending',   icon: <Clock      size={22} />, color: '#C17F24' },
  { label: 'Approved',        key: 'approved',  icon: <CheckCircle size={22} />, color: '#2E7D32' },
  { label: 'Completed',       key: 'completed', icon: <CheckSquare size={22} />, color: '#1565C0' },
];`
);

// ─── 4. Remove inline Sidebar ─────────────────────────────────────────────
const sidebarStart = c.indexOf('/** Sidebar navigation */');
const statCardStart = c.indexOf('/** Stat card widget */');
if (sidebarStart !== -1 && statCardStart !== -1) {
  c = c.substring(0, sidebarStart) + c.substring(statCardStart);
}

// ─── 5. Remove collapsed state ────────────────────────────────────────────
c = c.replace(/\s*\/\/ Layout state\r?\n\s*const \[collapsed, setCollapsed\] = useState\(false\);\r?\n/, '\n');

// ─── 6. Map activeNav ─────────────────────────────────────────────────────
c = c.replace(/activeNav === 'My Events'/g, "activeNav === 'Events'");

// ─── 7. Replace Toast emoji icons ─────────────────────────────────────────
c = c.replace(
  /<span style=\{styles\.toastIcon\}>[^<]*<\/span>/g,
  '<span style={styles.toastIcon}>{isSuccess ? <CheckCircle size={15} color="#1B5E20" /> : <AlertTriangle size={15} color="#B71C1C" />}</span>'
);

// ─── 8. Replace main return block ─────────────────────────────────────────
const oldReturnStart = `  return (\r\n    <div style={styles.root}>\r\n\r\n      {/* ── Sidebar ─────────────────────────────────────────── */}\r\n      <Sidebar user={user} onLogout={handleLogout} collapsed={collapsed} activeNav={activeNav} setActiveNav={setActiveNav} />\r\n\r\n      {/* ── Main area ───────────────────────────────────────── */}\r\n      <div style={styles.main}>\r\n\r\n        {/* ── Top bar ───────────────────────────────────────── */}\r\n        <header style={styles.topBar}>\r\n          <button\r\n            style={styles.collapseBtn}\r\n            onClick={() => setCollapsed((c) => !c)}\r\n            aria-label="Toggle sidebar"\r\n          >\r\n            {collapsed ? '→' : '←'}\r\n          </button>\r\n\r\n          <div style={styles.topBarCenter}>\r\n            <h1 style={styles.topBarTitle}>Student Affairs Dashboard</h1>\r\n            <p style={styles.topBarSub}>\r\n              {new Date().toLocaleDateString('en-IN', {\r\n                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',\r\n              })}\r\n            </p>\r\n          </div>\r\n\r\n          {/* Notification Bell + User pill */}\r\n          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>\r\n            <NotificationBell />\r\n            <UserProfileDropdown user={user} />\r\n          </div>\r\n        </header>\r\n\r\n        {/* ── Scrollable content ────────────────────────────── */}\r\n        <div style={styles.content}>`;
const newReturnStart = `  return (\r\n    <DashboardLayout role="student_affairs" activeNav={activeNav} onNavChange={setActiveNav}>\r\n      <>`;

if (c.includes(oldReturnStart)) {
  c = c.replace(oldReturnStart, newReturnStart);
  console.log('✓ Replaced return/Sidebar/topbar block');
} else {
  // LF fallback
  const m = c.match(/return \(\r?\n\s*<div style=\{styles\.root\}>/);
  if (m) {
    const startIdx = m.index;
    const contentDivMarker = '<div style={styles.content}>';
    const contentDivIdx = c.indexOf(contentDivMarker, startIdx);
    if (contentDivIdx !== -1) {
      const endIdx = contentDivIdx + contentDivMarker.length;
      c = c.substring(0, startIdx)
        + `  return (\n    <DashboardLayout role="student_affairs" activeNav={activeNav} onNavChange={setActiveNav}>\n      <>`
        + c.substring(endIdx);
      console.log('✓ Fallback replacement succeeded');
    }
  }
}

// ─── 9. Strip closing divs before modals ──────────────────────────────────
const oldContentClose = `        </div> {/* /content */}\r\n      </div> {/* /main */}\r\n\r\n      {/* ── Modals ── */}`;
const newContentClose = `\r\n      {/* ── Modals ── */}`;
if (c.includes(oldContentClose)) {
  c = c.replace(oldContentClose, newContentClose);
  console.log('✓ Stripped inner closing tags');
} else {
  const oldLF = `        </div> {/* /content */}\n      </div> {/* /main */}\n\n      {/* ── Modals ── */}`;
  if (c.includes(oldLF)) {
    c = c.replace(oldLF, '\n      {/* ── Modals ── */}');
    console.log('✓ Stripped inner closing tags (LF)');
  }
}

// ─── 10. Replace final root div ───────────────────────────────────────────
const finalDiv = `    </div>\r\n  );\r\n}`;
const finalDivNew = `    </>\r\n    </DashboardLayout>\r\n  );\r\n}`;
const lastIdx = c.lastIndexOf(finalDiv);
if (lastIdx !== -1) {
  c = c.substring(0, lastIdx) + finalDivNew + c.substring(lastIdx + finalDiv.length);
  console.log('✓ Fixed final closing tag');
} else {
  const finalLF = `    </div>\n  );\n}`;
  const finalLFNew = `    </>\n    </DashboardLayout>\n  );\n}`;
  const lastIdxLF = c.lastIndexOf(finalLF);
  if (lastIdxLF !== -1) {
    c = c.substring(0, lastIdxLF) + finalLFNew + c.substring(lastIdxLF + finalLF.length);
    console.log('✓ Fixed final closing tag (LF)');
  }
}

// ─── 11. Strip emoji ──────────────────────────────────────────────────────
const emojiRx = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]/gus;
c = c.replace(emojiRx, '');

fs.writeFileSync(FILE, c);
console.log('✅ StudentAffairsDashboard migration complete');
