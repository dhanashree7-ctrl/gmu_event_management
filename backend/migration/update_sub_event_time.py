import os

ui_files = [
    'frontend/src/pages/FacultyDashboard.js',
    'frontend/src/pages/HODDashboard.js',
    'frontend/src/pages/ExecutiveDashboard.js',
    'frontend/src/pages/StudentAffairsDashboard.js'
]

for file_path in ui_files:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    state_var = "form" if 'FacultyDashboard.js' in file_path or 'StudentAffairsDashboard.js' in file_path else "formData"
    set_call = "handleFieldChange('sub_events', newSubs);" if state_var == "form" else f"setFormData({{{state_var}, sub_events: newSubs}});"

    old_venue = """                            <input
                              type="text"
                              value={sub.venue || ''}
                              onChange={(e) => {
                                const newSubs = [...""" + state_var + """.sub_events];
                                newSubs[idx].venue = e.target.value;
                                """ + set_call + """
                              }}
                              placeholder="Sub-Event Venue"
                              style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                            />"""
                            
    new_venue = old_venue + """
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', color: '#666', whiteSpace: 'nowrap' }}>Start Time:</label>
                                <input
                                  type="time"
                                  value={sub.start_time || ''}
                                  onChange={(e) => {
                                    const newSubs = [...""" + state_var + """.sub_events];
                                    newSubs[idx].start_time = e.target.value;
                                    """ + set_call + """
                                  }}
                                  style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                                />
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', color: '#666', whiteSpace: 'nowrap' }}>End Time:</label>
                                <input
                                  type="time"
                                  value={sub.end_time || ''}
                                  onChange={(e) => {
                                    const newSubs = [...""" + state_var + """.sub_events];
                                    newSubs[idx].end_time = e.target.value;
                                    """ + set_call + """
                                  }}
                                  style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                                />
                            </div>"""

    if "Start Time:" not in content:
        content = content.replace(old_venue, new_venue)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Added sub_events time inputs.")
