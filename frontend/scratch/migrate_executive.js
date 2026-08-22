/**
 * migrate_executive.js
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join('C:', 'Event Management', 'frontend', 'src', 'pages', 'ExecutiveDashboard.js');
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

// ─── 4. Replace Toast emoji icons ─────────────────────────────────────────
c = c.replace(
  /<span style=\{styles\.toastIcon\}>[^<]*<\/span>/g,
  '<span style={styles.toastIcon}>{isSuccess ? <CheckCircle size={15} color="#1B5E20" /> : <AlertTriangle size={15} color="#B71C1C" />}</span>'
);

// ─── 5. Remove collapsed state ────────────────────────────────────────────
c = c.replace(/\s*\/\/ Sidebar state\r?\n\s*const \[collapsed, setCollapsed\] = useState\(false\);\r?\n/, '\n');

// ─── 6. Convert activeNav states to match GlobalSidebar ───────────────────
c = c.replace(/activeNav === 'dashboard'/g, "activeNav === 'Dashboard'");
c = c.replace(/activeNav === 'action-center'/g, "activeNav === 'Action Center'");
c = c.replace(/activeNav === 'my-proposals'/g, "activeNav === 'Events'");
c = c.replace(/activeNav === 'approved-history'/g, "activeNav === 'Approved by me'");
c = c.replace(/activeNav === 'calendar'/g, "activeNav === 'Calendar'");
c = c.replace(/activeNav === 'reports'/g, "activeNav === 'Reports'");
c = c.replace(/activeNav === 'archive'/g, "activeNav === 'Archive'");
c = c.replace(/activeNav === 'notifications'/g, "activeNav === 'Notifications'");
// And initial state
c = c.replace(/useState\('dashboard'\)/g, "useState('Dashboard')");

// ─── 7. Replace main return block ─────────────────────────────────────────
const oldReturnStart = `  return (\r\n    <div style={styles.root}>\r\n      {/* ── Left Sidebar ────────────────────────────────────────── */}`;
const newReturnStart = `  return (\r\n    <DashboardLayout role={user.role} activeNav={activeNav} onNavChange={setActiveNav}>\r\n      <>`;

const m = c.match(/return \(\r?\n\s*<div style=\{styles\.root\}>/);
if (m) {
  const startIdx = m.index;
  const contentDivMarker = '<div style={styles.content}>';
  const contentDivIdx = c.indexOf(contentDivMarker, startIdx);
  if (contentDivIdx !== -1) {
    const endIdx = contentDivIdx + contentDivMarker.length;
    c = c.substring(0, startIdx)
      + `  return (\n    <DashboardLayout role={user.role} activeNav={activeNav} onNavChange={setActiveNav}>\n      <>`
      + c.substring(endIdx);
    console.log('✓ Replaced return/Sidebar/topbar block');
  }
}

// ─── 8. Strip closing divs before modals ──────────────────────────────────
// Usually:
//        </div>
//      </div>
//    </div>
//
//    {/* ── Action Center Approval Modal ── */}
const oldContentClose = `        </div>\r\n      </div>\r\n    </div>\r\n\r\n    {/* ── Action Center Approval Modal ── */}`;
const newContentClose = `\r\n    {/* ── Action Center Approval Modal ── */}`;

if (c.includes(oldContentClose)) {
  c = c.replace(oldContentClose, newContentClose);
  console.log('✓ Stripped inner closing tags');
} else {
  // LF
  const oldLF = `        </div>\n      </div>\n    </div>\n\n    {/* ── Action Center Approval Modal ── */}`;
  const newLF = `\n    {/* ── Action Center Approval Modal ── */}`;
  if (c.includes(oldLF)) {
    c = c.replace(oldLF, newLF);
    console.log('✓ Stripped inner closing tags (LF version)');
  }
}

// ─── 9. Replace final root div ────────────────────────────────────────────
//         </div>
//       )}
//     </div>
//   );
// }
// =>
//         </div>
//       )}
//     </>
//     </DashboardLayout>
//   );
// }
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

// ─── 10. Strip emoji ──────────────────────────────────────────────────────
const emojiRx2 = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]/gus;
c = c.replace(emojiRx2, '');

fs.writeFileSync(FILE, c);
console.log('✅ ExecutiveDashboard migration complete');
