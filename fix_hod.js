const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/HODDashboard.js', 'utf8');

const dashboardRegex = /\{\s*activeNav === 'Dashboard' && \(\s*<div style=\{styles\.contentCard\}>\s*<h2 style=\{styles\.sectionTitle\}>Good \{getGreeting\(\)\}, \{user\?\.name\?\.split\(' '\)\[0\]\}<\/h2>\s*<p style=\{styles\.sectionSub\}>Manage department approvals and review event metrics\.<\/p>\s*<div style=\{styles\.statsRow\}>\s*<div style=\{styles\.statCard\}>\s*<div style=\{styles\.statTitle\}>Pending Reviews<\/div>\s*<div style=\{styles\.statValue\}>\{pendingEvents\.length\}<\/div>\s*<\/div>\s*<div style=\{styles\.statCard\}>\s*<div style=\{styles\.statTitle\}>My Approvals<\/div>\s*<div style=\{styles\.statValue\}>\{approvedEvents\.length\}<\/div>\s*<\/div>\s*<\/div>\s*<DashboardMetrics \s*data=\{\[\s*\{ name: 'Pending Approvals', count: pendingEvents\.length \},\s*\{ name: 'Approved Events', count: approvedEvents\.length \},\s*\{ name: 'My Proposals', count: myEvents\.length \}\s*\]\} \s*type="overview" \s*\/>\s*<\/div>\s*\)/;

const newDashboardContent = `{activeNav === 'Dashboard' && (
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
                  Manage department approvals and review event metrics.
                </p>
              </div>
              <div style={{
                position: 'absolute', right: '-20px', top: '-20px', fontSize: '120px', opacity: 0.1, transform: 'rotate(15deg)'
              }}>
                🏛️
              </div>
            </div>
            
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <div style={{...styles.statIcon, background: '#C17F2418'}}>
                  <span style={styles.statEmoji}>⏳</span>
                </div>
                <div>
                  <p style={styles.statValue}>{pendingEvents.length}</p>
                  <p style={styles.statLabel}>Pending Reviews</p>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statIcon, background: '#2E7D3218'}}>
                  <span style={styles.statEmoji}>✅</span>
                </div>
                <div>
                  <p style={styles.statValue}>{approvedEvents.length}</p>
                  <p style={styles.statLabel}>My Approvals</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <DashboardMetrics 
                data={[
                  { name: 'Pending Approvals', count: pendingEvents.length },
                  { name: 'Approved Events', count: approvedEvents.length },
                  { name: 'My Proposals', count: myEvents.length }
                ]} 
                type="overview" 
              />
            </div>
          </>
        )}`;

if (dashboardRegex.test(content)) {
  content = content.replace(dashboardRegex, newDashboardContent);
  console.log("Successfully replaced HOD Dashboard view.");
} else {
  console.log("Could not find HOD Dashboard view to replace.");
}

const stylesInjectRegex = /statsRow: \{/;
const stylesToInject = `statIcon: {
    width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem', flexShrink: 0
  },
  statEmoji: { fontSize: '1.5rem' },
  statValue: { fontSize: '1.75rem', fontWeight: 'bold', margin: '0 0 0.25rem 0', color: '#111827' },
  statLabel: { margin: 0, color: '#6B7280', fontSize: '0.875rem', fontWeight: '500' },
  statsRow: {`;

if (content.includes('statsRow: {') && !content.includes('statEmoji:')) {
    content = content.replace(stylesInjectRegex, stylesToInject);
    
    // update statCard to flex
    content = content.replace(/statCard: \{\s*background: '#fff',\s*borderRadius: '12px',\s*padding: '1\.5rem',\s*boxShadow: '0 2px 10px rgba\(0,0,0,0\.05\)',/, 
    "statCard: { background: 'linear-gradient(135deg, #ffffff 0%, #fdfbf7 100%)', borderRadius: '16px', padding: '1rem 1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center',");
}

fs.writeFileSync('frontend/src/pages/HODDashboard.js', content);
