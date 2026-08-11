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

  // Replace 1
  if (!content.includes("rewards: '',")) {
    content = content.replace(/budget: '',/g, "budget: '',\n    rewards: '',");
  }

  // Replace 2
  if (!content.includes("fd.append('rewards', formData.rewards);")) {
    content = content.replace(/fd\.append\('budget', formData\.budget\);/g, "fd.append('budget', formData.budget);\n      if (formData.rewards) fd.append('rewards', formData.rewards);");
  }

  // Replace 3
  const search3 = `<div style={styles.formGroup}>\n                        <label style={styles.formLabel}>Brochure Document <span style={styles.required}>*</span></label>`;
  const replace3 = `<div style={styles.formGroup}>\n                        <label style={styles.formLabel}>Rewards and Prizes</label>\n                        <textarea\n                          name="rewards"\n                          value={formData.rewards}\n                          onChange={handleProposeChange}\n                          style={s(styles.formInput, { minHeight: '80px', resize: 'vertical' })}\n                          placeholder="List any rewards, cash prizes, or certificates provided..."\n                        />\n                      </div>\n\n                      <div style={styles.formGroup}>\n                        <label style={styles.formLabel}>Brochure Document <span style={styles.required}>*</span></label>`;
  
  if (!content.includes('Rewards and Prizes')) {
    content = content.replace(search3, replace3);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
