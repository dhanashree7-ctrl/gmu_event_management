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

    bad_filter = f"JSON.stringify({state_var}.sub_events.filter(s => s.trim() !== ''))"
    good_filter = f"JSON.stringify({state_var}.sub_events.filter(s => s.name && s.name.trim() !== ''))"

    if bad_filter in content:
        content = content.replace(bad_filter, good_filter)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

print("Fixed sub_events filter logic.")
