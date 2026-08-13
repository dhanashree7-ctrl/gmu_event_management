import os
import re

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

    # 1. Hide main participation type if festival
    # Find the line containing "Participation Type" and "Solo / Group toggle"
    # and replace the start of the block
    if not re.search(r'\{\!\(' + state_var + r'\.is_festival\) && \(\s*<>', content):
        pattern_part = re.compile(r'(\s*\{\/\*\s*Participation Type.*Solo / Group toggle \*\/\})')
        content = pattern_part.sub(r'\n                {!(' + state_var + r'.is_festival) && (<>\1', content, count=1)
        
        pattern_start = re.compile(r'(\s*\{\/\*\s*Start Time\s*\*\/\})')
        content = pattern_start.sub(r'\n                </>)}\1', content, count=1)

    # 2. Add venue input for sub events
    old_coord = """                            <input
                              type="text"
                              value={sub.coordinator_name || ''}
                              onChange={(e) => {
                                const newSubs = [...""" + state_var + """.sub_events];
                                newSubs[idx].coordinator_name = e.target.value;
                                """ + set_call + """
                              }}
                              placeholder="Coordinator Name"
                              style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                            />"""
                            
    new_coord = old_coord + """
                            <input
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

    if "placeholder=\"Sub-Event Venue\"" not in content:
        content = content.replace(old_coord, new_coord)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated sub-event UI.")
