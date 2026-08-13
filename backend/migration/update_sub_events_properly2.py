import os
import re

ui_files = [
    'frontend/src/pages/FacultyDashboard.js',
    'frontend/src/pages/HODDashboard.js',
    'frontend/src/pages/ExecutiveDashboard.js'
]

for file_path in ui_files:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    state_var = "form" if 'FacultyDashboard.js' in file_path else "formData"
    set_call = f"handleFieldChange('sub_events', newSubs);" if state_var == "form" else f"setFormData({{{state_var}, sub_events: newSubs}});"

    insert = f"""
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                              value={{sub.participation_type || 'solo'}}
                              onChange={{(e) => {{
                                const newSubs = [...{state_var}.sub_events];
                                newSubs[idx].participation_type = e.target.value;
                                {set_call}
                              }}}}
                              style={{Object.assign({{}}, styles.formInput, {{ padding: '8px', flex: 1 }})}}
                            >
                              <option value="solo">Solo</option>
                              <option value="group">Group</option>
                            </select>
                            <input
                              type="number"
                              value={{sub.max_participants || ''}}
                              onChange={{(e) => {{
                                const newSubs = [...{state_var}.sub_events];
                                newSubs[idx].max_participants = e.target.value;
                                {set_call}
                              }}}}
                              placeholder="Max Participants"
                              style={{Object.assign({{}}, styles.formInput, {{ padding: '8px', flex: 1 }})}}
                            />
                            <input
                              type="text"
                              value={{sub.coordinator_name || ''}}
                              onChange={{(e) => {{
                                const newSubs = [...{state_var}.sub_events];
                                newSubs[idx].coordinator_name = e.target.value;
                                {set_call}
                              }}}}
                              placeholder="Coordinator Name"
                              style={{Object.assign({{}}, styles.formInput, {{ padding: '8px', flex: 1 }})}}
                            />
                          </div>"""

    if "sub.participation_type" not in content:
        pattern = r'(required=\{form(?:Data)?\.is_festival\}\s*/>)'
        content = re.sub(pattern, r'\1' + insert, content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated sub_events UI properly.")
