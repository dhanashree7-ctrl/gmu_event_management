const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/StudentAffairsDashboard.js', 'utf8');

// 1. Replace the render wrappers
const renderStartRegex = /return \(\s*<div style=\{styles\.root\}>[\s\S]*?<main style=\{styles\.contentArea\}>/;

const newRenderStart = `return (
    <DashboardLayout role="student_affairs" activeNav={activeNav} onNavChange={setActiveNav} onOpenSettings={() => setActiveNav('Settings')}>
      <>
        {toast && (
          <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        )}

        {/* Welcome banner */}
        {activeNav === 'Dashboard' && (
          <div style={styles.welcomeBanner}>
            <div>
              <h2 style={styles.welcomeTitle}>
                Good {getGreeting()}, {user?.name?.split(' ')[0]}
              </h2>
              <p style={styles.welcomeSub}>
                Here is what's happening with student affairs today.
              </p>
            </div>
            <div style={styles.welcomeDecor}></div>
          </div>
        )}
`;

content = content.replace(renderStartRegex, newRenderStart);

// 2. Replace the bottom wrappers
const renderEndRegex = /<\/main>\s*<\/div>\s*<\/div>\s*\)\s*;\s*\}\s*\/\/\s*── Helper:/;
const newRenderEnd = `      </>
    </DashboardLayout>
  );
}

// ── Helper:`;

content = content.replace(renderEndRegex, newRenderEnd);

// 3. Remove Sidebar component and NAV_ITEMS completely
const sidebarCompRegex = /\/\*\* Sidebar navigation \*\/[\s\S]*?function Sidebar\([\s\S]*?<\/aside>\s*;\s*\}/;
content = content.replace(sidebarCompRegex, '');

const navItemsRegex = /const NAV_ITEMS = \[[\s\S]*?\];/;
content = content.replace(navItemsRegex, '');

// 4. Add DashboardLayout import if missing
if (!content.includes("DashboardLayout")) {
  content = content.replace(
    "import { API_BASE } from '../config/api';", 
    "import { API_BASE } from '../config/api';\nimport DashboardLayout from '../components/layout/DashboardLayout';"
  );
}

// 5. Change 'My Events' to 'Events' mapping
content = content.replace(/activeNav === 'My Events'/g, "activeNav === 'Events'");
content = content.replace(/setActiveNav\('My Events'\)/g, "setActiveNav('Events')");

// 6. Merge 'New Request' into 'Events'
// Instead of a separate 'New Request' tab, when activeNav === 'Events' we can show the New Request form if a state `proposing` is true, 
// or simply add a button. But wait! The simplest is to map 'New Request' to 'New Proposal' sub-view, but SA Dashboard has no `proposing` state.
// We'll leave the code for `activeNav === 'New Request'` but change it so it's checked if activeNav === 'New Request' (we can add 'New Request' button in Events tab).
// Let's replace `activeNav === 'New Request'` with `activeNav === 'New Request' || eventsTab === 'new'` later if needed.
// For now, let's just make activeNav === 'New Request' triggerable.

// 7. Add DashboardMetrics (Graphs) to 'Dashboard' view
// Currently, SA Dashboard renders StatCard's. Let's append DashboardMetrics.
const dashboardContentRegex = /\{activeNav === 'Dashboard' && \(\s*<div style=\{styles\.grid\}>\s*\{STAT_CARDS\.map\(\(stat\) => \([\s\S]*?<\/div>\s*\)\}/;
const newDashboardContent = `{activeNav === 'Dashboard' && (
          <>
            <div style={styles.grid}>
              {STAT_CARDS.map((stat) => (
                <StatCard key={stat.key} stat={stat} value={stats[stat.key]} />
              ))}
            </div>
            
            <div style={{ marginTop: '2rem' }}>
              <DashboardMetrics stats={stats} />
            </div>
          </>
        )}`;
content = content.replace(dashboardContentRegex, newDashboardContent);

// 8. Fix empty Action Center and Archive
// Let's duplicate the 'Events' view logic for 'Action Center' (where status === 'pending') and 'Archive' (status === 'completed' or 'rejected').
// We will do this by adding blocks for activeNav === 'Action Center' and activeNav === 'Archive'.

fs.writeFileSync('frontend/src/pages/StudentAffairsDashboard_updated.js', content);
console.log('Done modifying.');
