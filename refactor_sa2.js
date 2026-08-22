const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/StudentAffairsDashboard.js', 'utf8').replace(/\r\n/g, '\n');

// 1. Replace the render wrappers
const renderStartRegex = /return \(\s*<div style=\{styles\.root\}>[\s\S]*?<div style=\{styles\.content\}>/;

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
        )}`;

content = content.replace(renderStartRegex, newRenderStart);

// 2. Replace the bottom wrappers (from the last closing div of main render down to helper)
const renderEndRegex = /<\/div>\s*<\/div>\s*<\/div>\s*\)\s*;\s*\}\s*\/\/\s*── Helper:/;
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

// 6. Add DashboardMetrics (Graphs) to 'Dashboard' view
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


// Add Action Center and Archive blocks (clone of Events logic but filtered by status)
// We will look for `{activeNav === 'Events' && (`
// Wait, SA Dashboard renders Events list like this:
/*
  {activeNav === 'My Events' && (
    <div>
      <div style={styles.sectionHeader}>
      ...
*/
// Let's replace 'My Events' inside the regex to 'Events' since we already renamed it!
const eventsBlockRegex = /(\{activeNav === 'Events' && \(\s*<div.*?>[\s\S]*?<\/div>\s*\)\s*\})/;

// Actually, I shouldn't duplicate eventsBlock without verifying. Let's see if the regex matches.
// We'll write the script, output how many replacements were made, and inspect the file.
fs.writeFileSync('frontend/src/pages/StudentAffairsDashboard.js', content);
console.log('Modified StudentAffairsDashboard.js successfully');
