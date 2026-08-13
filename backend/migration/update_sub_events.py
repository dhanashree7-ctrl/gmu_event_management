import os
import re

files_to_edit = [
    'frontend/src/pages/FacultyDashboard.js',
    'frontend/src/pages/HODDashboard.js',
    'frontend/src/pages/ExecutiveDashboard.js'
]

for file_path in files_to_edit:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace initialization
    content = content.replace("{ name: '', description: '' }", "{ name: '', description: '', participation_type: 'solo', max_participants: '' }")
    
    # We need to insert the participation_type and max_participants fields.
    # The existing block looks like:
    """
                          <textarea
                            value={sub.description}
                            ...
                            required={form.is_festival}  // or formData.is_festival
                          />
    """
    
    def replacement_func(match):
        textarea_block = match.group(0)
        state_var = "form" if "form." in textarea_block or "handleFieldChange" in textarea_block or 'FacultyDashboard.js' in file_path else "formData"
        set_call = f"handleFieldChange('sub_events', newSubs);" if state_var == "form" else f"setFormData({{{state_var}, sub_events: newSubs}});"
        
        insert = f"""
                          <div style={{{{ display: 'flex', gap: '0.5rem' }}}}>
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
                          </div>
"""
        return textarea_block + insert

    # Regex to match the textarea block closing tag
    pattern = r'(<textarea\b[^>]*>.*?</textarea>\s*\{?[^<]*)'
    # Wait, the textarea is self-closing sometimes, or has no children.
    pattern2 = r'(<textarea\s+value=\{sub\.description\}[^>]*/>)'
    
    content = re.sub(pattern2, replacement_func, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {file_path}")
