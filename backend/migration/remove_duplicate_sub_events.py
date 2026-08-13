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

    # The pattern matches the first injected div completely, ending right before the <textarea>
    # The div starts with <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
    # and ends with </div> just before <textarea
    
    # We can be safe by matching the literal start of the div and using non-greedy match up to <textarea
    pattern = r'<div style=\{\{ display: \'flex\', gap: \'0\.5rem\', marginTop: \'0\.5rem\' \}\}>.*?</div>\s*<textarea'
    
    # re.sub with count=1 will only replace the FIRST occurrence (which is the one after the sub.name input)
    # in the file? Wait, there is only one textarea for sub.description in the map loop.
    content = re.sub(pattern, '<textarea', content, flags=re.DOTALL)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Removed duplicate injected inputs securely.")
