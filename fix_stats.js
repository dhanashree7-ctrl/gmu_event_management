const fs = require('fs');
const path = require('path');

const files = [
  'HODDashboard.js',
  'FacultyDashboard.js',
  'ExecutiveDashboard.js',
  'StudentAffairsDashboard.js'
];

files.forEach(file => {
  const filePath = path.join(__dirname, 'frontend/src/pages', file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex replacement for pending
  content = content.replace(/pending: json\.data\.filter\(\(e\) => \{\s*const st = e\.current_status\?\.toLowerCase\(\);\s*return st === 'pending' \|\| st === 'pending_approval';\s*\}\)\.length,/g, `pending: json.data.filter((e) => {
              const st = e.current_status?.toLowerCase() || '';
              return st.startsWith('pending');
            }).length,`);

  // Regex replacement for approved
  content = content.replace(/approved: json\.data\.filter\(\(e\) => e\.current_status\?\.toLowerCase\(\) === 'approved'\)\.length,/g, `approved: json.data.filter((e) => {
              const st = e.current_status?.toLowerCase() || '';
              return st === 'approved' || st === 'published';
            }).length,`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
