const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/ExecutiveDashboard.js', 'utf8').replace(/\r\n/g, '\n');

// 1. Add DashboardLayout import if missing
if (!content.includes("DashboardLayout")) {
  content = content.replace(
    "import { API_BASE } from '../config/api';", 
    "import { API_BASE } from '../config/api';\nimport DashboardLayout from '../components/layout/DashboardLayout';"
  );
}

// 2. Change activeNav default to 'Dashboard'
content = content.replace(/useState\('dashboard'\)/g, "useState('Dashboard')");

// 3. Replace all the activeNav comparisons
content = content.replace(/activeNav === 'dashboard'/g, "activeNav === 'Dashboard'");
content = content.replace(/activeNav === 'action-center'/g, "activeNav === 'Action Center'");
content = content.replace(/activeNav === 'my-proposals'/g, "activeNav === 'Events'");
content = content.replace(/activeNav === 'approved-history'/g, "activeNav === 'Approved by me'");
content = content.replace(/activeNav === 'calendar'/g, "activeNav === 'Calendar'");
content = content.replace(/activeNav === 'reports'/g, "activeNav === 'Reports'");
content = content.replace(/activeNav === 'archive'/g, "activeNav === 'Archive'");
content = content.replace(/activeNav === 'notifications'/g, "activeNav === 'Notifications'");
content = content.replace(/activeNav === 'settings'/g, "activeNav === 'Settings'");

// 4. Remove internal sidebar & header render logic
const renderStartRegex = /return \(\s*<div style=\{styles\.root\}>[\s\S]*?<main style=\{styles\.contentArea\}>/;

const newRenderStart = `return (
    <DashboardLayout role={user.role} activeNav={activeNav} onNavChange={setActiveNav} onOpenSettings={() => setActiveNav('Settings')}>
      <>
        {/* Dashboard View */}
        {activeNav === 'Dashboard' && (
          <>
            <div style={{
              background: 'linear-gradient(135deg, #7A110A 0%, #2A0404 100%)',
              borderRadius: '16px',
              padding: '2rem',
              color: '#fff',
              marginBottom: '2rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(122,17,10,0.2)'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
                  Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
                </h2>
                <p style={{ margin: '0.5rem 0 0', opacity: 0.9, fontSize: '1.1rem' }}>
                  Metrics & Overview
                </p>
              </div>
              <div style={{
                position: 'absolute', right: '-20px', top: '-20px', fontSize: '120px', opacity: 0.1, transform: 'rotate(15deg)'
              }}>
                🏛️
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>`;

content = content.replace(renderStartRegex, newRenderStart);

// 5. Remove the old Dashboard view that was left dangling since we replaced up to main
const oldDashboardRegex = /\{activeNav === 'Dashboard' && \(\s*<div style=\{styles\.contentCard\}>\s*<h2 style=\{styles\.sectionTitle\}>Dashboard<\/h2>\s*<p style=\{styles\.sectionSub\}>Metrics & Overview<\/p>\s*<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fit, minmax\(200px, 1fr\)\)', gap: '1rem', marginBottom: '2rem' \}\}>/;

content = content.replace(oldDashboardRegex, "");

// 6. Replace the bottom wrappers
const renderEndRegex = /<\/main>\s*<\/div>\s*<\/div>\s*\)\s*;\s*\}\s*\/\/\s*── Helper:/;
const newRenderEnd = `      </>
    </DashboardLayout>
  );
}

// ── Helper:`;

content = content.replace(renderEndRegex, newRenderEnd);

// 7. Remove the actual Sidebar HTML and internal classes since we no longer use it
const sidebarNavRegex = /\{\/\* ── Left Sidebar ──[\s\S]*?<\/aside>/;
content = content.replace(sidebarNavRegex, '');

fs.writeFileSync('frontend/src/pages/ExecutiveDashboard.js', content);
console.log('Done refactoring ExecutiveDashboard.js');
