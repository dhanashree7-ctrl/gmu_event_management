const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/FacultyDashboard.js', 'utf8').replace(/\r\n/g, '\n');
let target = `              <div style={styles.formGroup}>
                <label style={styles.label}>Written Summary (Optional)</label>
                <textarea
                  style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  placeholder="Summarize key highlights..."
                />
              </div>

              <div style={{ ...styles.formGroup, marginTop: '1rem' }}>
                <label style={styles.label}>Upload PDF Report (Optional)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setReportFile(e.target.files[0] || null)}
                  style={{
                    padding: '0.5rem',
                    border: '1px dashed #ccc',
                    borderRadius: '8px',
                    background: '#FAFAFA',
                    fontSize: '0.9rem',
                    color: '#555'
                  }}
                />
                <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  Max size: 5MB
                </small>
              </div>`.replace(/\r\n/g, '\n');

let repl = `              <div style={styles.formGroup}>
                <label style={{...styles.label, fontWeight: 600, color: '#333'}}>Written Summary (Optional)</label>
                <textarea
                  style={{ ...styles.input, minHeight: '120px', resize: 'vertical', borderRadius: '12px', padding: '1rem', border: '1px solid #E0E0E0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  placeholder="Summarize key highlights, achievements, and feedback..."
                />
              </div>

              <div style={{ ...styles.formGroup, marginTop: '1.5rem' }}>
                <label style={{...styles.label, fontWeight: 600, color: '#333'}}>Upload PDF Report (Optional)</label>
                <div style={{
                  position: 'relative',
                  border: '2px dashed #BDBDBD',
                  borderRadius: '12px',
                  background: '#FAFAFA',
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#1565C0'; e.currentTarget.style.background = '#F0F7FF'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#BDBDBD'; e.currentTarget.style.background = '#FAFAFA'; }}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setReportFile(e.target.files[0] || null)}
                    style={{
                      position: 'absolute', inset: 0, width: '100%', height: '100%',
                      opacity: 0, cursor: 'pointer'
                    }}
                  />
                  <div style={{ pointerEvents: 'none' }}>
                    <div style={{ marginBottom: '0.5rem', color: '#1565C0' }}>
                      <FileText size={32} style={{ margin: '0 auto' }} />
                    </div>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: '#333' }}>
                      {reportFile ? reportFile.name : 'Click or drag PDF here to upload'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                      {reportFile ? \`\${(reportFile.size / (1024*1024)).toFixed(2)} MB\` : 'Max size: 5MB (PDF only)'}
                    </p>
                  </div>
                </div>
              </div>`.replace(/\r\n/g, '\n');

if (content.includes(target)) {
  fs.writeFileSync('frontend/src/pages/FacultyDashboard.js', content.replace(target, repl));
  console.log("FacultyDashboard updated successfully");
} else {
  console.log("FacultyDashboard target string not found");
}

let saContent = fs.readFileSync('frontend/src/pages/StudentAffairsDashboard.js', 'utf8').replace(/\r\n/g, '\n');
let saTarget = `              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Written Summary (Optional)</label>
                <textarea
                  style={s(styles.formInput, { minHeight: '100px', resize: 'vertical' })}
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  placeholder="Summarize key highlights..."
                />
              </div>
              <div style={s(styles.formGroup, { marginTop: '1rem' })}>
                <label style={styles.formLabel}>Upload PDF Report (Optional)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setReportFile(e.target.files[0] || null)}
                  style={{
                    padding: '0.5rem',
                    border: '1px dashed #ccc',
                    borderRadius: '8px',
                    background: '#FAFAFA',
                    fontSize: '0.9rem',
                    color: '#555',
                    width: '100%'
                  }}
                />
                <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                  Max size: 5MB
                </small>
              </div>`.replace(/\r\n/g, '\n');

let saRepl = `              <div style={styles.formGroup}>
                <label style={{...styles.formLabel, fontWeight: 600, color: '#333'}}>Written Summary (Optional)</label>
                <textarea
                  style={{ ...styles.formInput, minHeight: '120px', resize: 'vertical', borderRadius: '12px', padding: '1rem', border: '1px solid #E0E0E0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  placeholder="Summarize key highlights, achievements, and feedback..."
                />
              </div>

              <div style={{ ...styles.formGroup, marginTop: '1.5rem' }}>
                <label style={{...styles.formLabel, fontWeight: 600, color: '#333'}}>Upload PDF Report (Optional)</label>
                <div style={{
                  position: 'relative',
                  border: '2px dashed #BDBDBD',
                  borderRadius: '12px',
                  background: '#FAFAFA',
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#1565C0'; e.currentTarget.style.background = '#F0F7FF'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#BDBDBD'; e.currentTarget.style.background = '#FAFAFA'; }}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setReportFile(e.target.files[0] || null)}
                    style={{
                      position: 'absolute', inset: 0, width: '100%', height: '100%',
                      opacity: 0, cursor: 'pointer'
                    }}
                  />
                  <div style={{ pointerEvents: 'none' }}>
                    <div style={{ marginBottom: '0.5rem', color: '#1565C0' }}>
                      <span style={{fontSize: '2rem'}}>📄</span>
                    </div>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: '#333' }}>
                      {reportFile ? reportFile.name : 'Click or drag PDF here to upload'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                      {reportFile ? \`\${(reportFile.size / (1024*1024)).toFixed(2)} MB\` : 'Max size: 5MB (PDF only)'}
                    </p>
                  </div>
                </div>
              </div>`.replace(/\r\n/g, '\n');

if (saContent.includes(saTarget)) {
  fs.writeFileSync('frontend/src/pages/StudentAffairsDashboard.js', saContent.replace(saTarget, saRepl));
  console.log("StudentAffairsDashboard updated successfully");
} else {
  console.log("StudentAffairsDashboard target string not found");
}
