const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/HODDashboard.js', 'utf8');
const idx = c.lastIndexOf('};');
if (idx !== -1) {
  let newContent = c.substring(0, idx + 2) + "\n\nfunction getGreeting() { const h = new Date().getHours(); if (h < 12) return 'Morning'; if (h < 17) return 'Afternoon'; return 'Evening'; }\n";
  fs.writeFileSync('frontend/src/pages/HODDashboard.js', newContent);
  console.log('Fixed');
}
