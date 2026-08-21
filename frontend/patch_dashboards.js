const fs = require('fs');

function patchDashboard(file, role) {
  let c = fs.readFileSync(file, 'utf8');
  
  // Remove Sidebar import
  c = c.replace(/import Sidebar from [\s\S]*?;\r?\n/, '');
  
  // Add DashboardLayout and Lucide icons
  if (!c.includes('DashboardLayout')) {
    c = c.replace(/import React, \{ useState, useEffect \} from 'react';/, "import React, { useState, useEffect } from 'react';\nimport DashboardLayout from '../components/layout/DashboardLayout';\nimport { FileText, Clock, CheckCircle, CheckSquare, AlertTriangle } from 'lucide-react';");
  }

  // Strip emojis from the Sidebar component completely, we don't need it.
  c = c.replace(/function Sidebar\(\{[\s\S]*?\/\/\s*── (Main|Main Component)/, '// ── Main Component');
  
  // Replace opening layout
  const rootStart = c.indexOf('<div style={styles.root}>');
  const contentStart = c.indexOf('<div style={styles.content}>', rootStart);
  if (rootStart !== -1 && contentStart !== -1) {
    const end = contentStart + '<div style={styles.content}>'.length;
    c = c.substring(0, rootStart) + `<DashboardLayout role="${role}" activeNav={activeNav} onNavChange={setActiveNav}>\n      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>` + c.substring(end);
  }

  // Replace STAT_CARDS
  c = c.replace(/const STAT_CARDS = \[[\s\S]*?\];/, `const STAT_CARDS = [
  { label: 'Total Submitted', key: 'total', icon: <FileText size={24} />, color: theme.colors.maroon },
  { label: 'Pending Approval', key: 'pending', icon: <Clock size={24} />, color: '#C17F24' },
  { label: 'Approved', key: 'approved', icon: <CheckCircle size={24} />, color: '#2E7D32' },
  { label: 'Completed', key: 'completed', icon: <CheckSquare size={24} />, color: '#1565C0' },
];`);

  // Replace Toast icons
  c = c.replace(/<span style=\{styles\.toastIcon\}>.*?<\/span>/, `<span style={styles.toastIcon}>{isSuccess ? <CheckCircle size={16} color="#1B5E20" /> : <AlertTriangle size={16} color="#B71C1C" />}</span>`);

  // Fix closing tags
  // The original had </div></div></div> before the modals.
  // We need to replace those three with </DashboardLayout>
  // Let's find the closing of the main view before modals
  // usually it's just `</div>\n      </div>\n    </div>`
  c = c.replace(/<\/div>\s*<\/div>\s*<\/div>\s*(?=\/\* ──)/, '</DashboardLayout>\n\n      ');
  // If there wasn't a comment `/* ──` after it, just replace the first three divs after `</div>\n        )}`
  c = c.replace(/<\/div>\s*<\/div>\s*<\/div>\s*(?=\{[\w]+ModalOpen)/, '</DashboardLayout>\n\n      ');
  
  // Just in case it's Executive Dashboard which uses <main>
  const mainStart = c.indexOf('<main style={styles.content}>');
  if (mainStart !== -1) {
      c = c.replace(/<div style=\{styles\.root\}>[\s\S]*?<main style=\{styles\.content\}>/, `<DashboardLayout role="${role}" activeNav={activeTab} onNavChange={setActiveTab}>\n      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>`);
      c = c.replace(/<\/main>\s*<\/div>\s*<\/div>/, '</DashboardLayout>');
  }

  fs.writeFileSync(file, c);
  console.log('Patched ' + file);
}

patchDashboard('src/pages/FacultyDashboard.js', 'faculty');
patchDashboard('src/pages/StudentAffairsDashboard.js', 'student_affairs');
patchDashboard('src/pages/ExecutiveDashboard.js', 'executive');
