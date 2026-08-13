import os
import re

# 1. Update create_event.php
create_event_path = 'backend/create_event.php'
with open(create_event_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Insert extraction of coordinator_name
if '$coordinator_name = isset' not in content:
    content = content.replace(
        "$rewards = isset($_POST['rewards']) ? trim(strip_tags((string)$_POST['rewards'])) : '';",
        "$rewards = isset($_POST['rewards']) ? trim(strip_tags((string)$_POST['rewards'])) : '';\n$coordinator_name = isset($_POST['coordinator_name']) ? trim(strip_tags($_POST['coordinator_name'])) : '';"
    )

if "$details_arr['coordinator_name']" not in content:
    content = content.replace(
        "if ($rewards !== '')                      $details_arr['rewards'] = $rewards;",
        "if ($rewards !== '')                      $details_arr['rewards'] = $rewards;\nif ($coordinator_name !== '')             $details_arr['coordinator_name'] = $coordinator_name;"
    )

with open(create_event_path, 'w', encoding='utf-8') as f:
    f.write(content)


# 2. Update Dashboard UI Files
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

    # Add coordinator_name to initial state if not there
    if 'coordinator_name:' not in content:
        content = re.sub(r'date: \'\',', r"date: '', coordinator_name: '',", content) # For SA
        content = re.sub(r'event_title: \'\', date: \'\',', r"event_title: '', date: '', coordinator_name: '',", content) # For others

    # Append to FormData
    if "append('coordinator_name'" not in content:
        content = re.sub(r"append\('date', ([^)]+)\);", r"append('date', \1);\n      fd.append('coordinator_name', \1.replace('date', 'coordinator_name'));", content)
        # Handle cases where 'date' is form.date vs formData.date
        content = content.replace("fd.append('coordinator_name', form.date.replace('date', 'coordinator_name'));", "if (form.coordinator_name) fd.append('coordinator_name', form.coordinator_name);")
        content = content.replace("fd.append('coordinator_name', formData.date.replace('date', 'coordinator_name'));", "if (formData.coordinator_name) fd.append('coordinator_name', formData.coordinator_name);")

    # For Faculty/HOD/Exec, add to fd inside the append section if the regex didn't catch it properly
    if "fd.append('coordinator_name'" not in content and "formData.append('coordinator_name'" not in content:
        content = re.sub(r"append\('event_date', ([^)]+)\);", r"append('event_date', \1);\n      formData.append('coordinator_name', form.coordinator_name);", content)
        content = re.sub(r"append\('event_date', formData\.date\);", r"append('event_date', formData.date);\n      fd.append('coordinator_name', formData.coordinator_name);", content)

    # Insert Main Coordinator UI input
    main_input = """
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Main Coordinator Name</label>
                          <input style={styles.formInput} type="text" name="coordinator_name" placeholder="e.g. Dr. Smith" value={FORM_VAR.coordinator_name || ''} onChange={CHANGE_VAR} />
                        </div>
"""
    if "Main Coordinator Name" not in content:
        if 'FacultyDashboard.js' in file_path:
            content = content.replace("Venue is required for offline events", main_input.replace('FORM_VAR', 'form').replace('CHANGE_VAR', '(e) => handleFieldChange("coordinator_name", e.target.value)') + "Venue is required for offline events")
        elif 'StudentAffairsDashboard.js' in file_path:
            content = content.replace('id="date"', main_input.replace('FORM_VAR', 'form').replace('CHANGE_VAR', '(e) => handleFieldChange("coordinator_name", e.target.value)') + 'id="date"')
        else:
            content = content.replace('name="venue"', main_input.replace('FORM_VAR', 'formData').replace('CHANGE_VAR', 'handleProposeChange') + 'name="venue"')

    # Sub-events initial state
    content = content.replace("participation_type: 'solo', max_participants: '' }", "participation_type: 'solo', max_participants: '', coordinator_name: '' }")

    # Sub-events Coordinator UI input
    sub_input = """
                            <input
                              type="text"
                              value={sub.coordinator_name || ''}
                              onChange={(e) => {
                                const newSubs = [...SUB_VAR];
                                newSubs[idx].coordinator_name = e.target.value;
                                SET_VAR
                              }}
                              placeholder="Coordinator Name"
                              style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                            />
"""
    if 'FacultyDashboard.js' in file_path:
        sub_ui = sub_input.replace('SUB_VAR', 'form.sub_events').replace('SET_VAR', "handleFieldChange('sub_events', newSubs);")
    else:
        sub_ui = sub_input.replace('SUB_VAR', 'formData.sub_events').replace('SET_VAR', "setFormData({...formData, sub_events: newSubs});")
        
    if "Coordinator Name" not in content and 'is_festival' in content:
        # Inject after Max Participants input
        content = re.sub(r'(placeholder="Max Participants"[^>]*/>)', r'\1' + sub_ui, content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated backend and dashboard files.")
