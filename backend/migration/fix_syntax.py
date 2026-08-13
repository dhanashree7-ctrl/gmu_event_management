import os
import re

# Fix Executive and HOD
for file_path in ['frontend/src/pages/ExecutiveDashboard.js', 'frontend/src/pages/HODDashboard.js']:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the broken block
    broken_pattern = r'(<input[^>]*?type="text"\s*)(\s*<div style=\{styles\.formGroup\}>\s*<label style=\{styles\.formLabel\}>Main Coordinator Name</label>\s*<input[^>]*name="coordinator_name"[^>]*/>\s*</div>\s*)(name="venue"[^>]*/>)'
    
    # Replace it by putting the venue input first, then closing the div, then the coordinator div
    def fix_hod_exec(match):
        input_start = match.group(1)
        coordinator_div = match.group(2)
        input_end = match.group(3)
        return input_start + input_end + "\n                      </div>\n" + coordinator_div.replace('\n', '\n  ') + "<div style={styles.formGroup}>"
    
    # Wait, the formGroup for venue is already closed later!
    # Let's just do a simpler replace.
    # The current broken code:
    """
                        <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Venue <span style={styles.required}>*</span></label>
                        <input style={styles.formInput} type="text" 
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Main Coordinator Name</label>
                          <input style={styles.formInput} type="text" name="coordinator_name" placeholder="e.g. Dr. Smith" value={formData.coordinator_name || ''} onChange={handleProposeChange} />
                        </div>
name="venue" value={formData.venue} onChange={handleProposeChange} placeholder="e.g. Main Auditorium" required />
                      </div>
    """
    
    # Let's just remove the coordinator div, and append it AFTER the venue group.
    coordinator_div_pattern = r'(\s*<div style=\{styles\.formGroup\}>\s*<label style=\{styles\.formLabel\}>Main Coordinator Name</label>\s*<input[^>]*name="coordinator_name"[^>]*/>\s*</div>\s*)'
    
    match = re.search(coordinator_div_pattern, content)
    if match:
        coord_div_str = match.group(1)
        # Remove it from its current position
        content = content.replace(coord_div_str, " ")
        
        # Now find the end of the venue group and append it
        # venue input ends with required /> or similar, followed by </div>
        # We can just look for the row ending.
        # Actually, let's insert it before the Venue group.
        venue_group_pattern = r'(<div style=\{styles\.formGroup\}>\s*<label style=\{styles\.formLabel\}>Venue)'
        content = re.sub(venue_group_pattern, coord_div_str + r'\1', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)


# Fix StudentAffairs
file_path = 'frontend/src/pages/StudentAffairsDashboard.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

coordinator_div_pattern = r'(\s*<div style=\{styles\.formGroup\}>\s*<label style=\{styles\.formLabel\}>Main Coordinator Name</label>\s*<input[^>]*name="coordinator_name"[^>]*/>\s*</div>\s*)'
match = re.search(coordinator_div_pattern, content)
if match:
    coord_div_str = match.group(1)
    content = content.replace(coord_div_str, " ")
    
    # Insert it before the Date group
    date_group_pattern = r'(<div style=\{styles\.formGroup\}>\s*<label style=\{styles\.formLabel\} htmlFor="date">)'
    content = re.sub(date_group_pattern, coord_div_str + r'\1', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Fix Faculty
file_path = 'frontend/src/pages/FacultyDashboard.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(coordinator_div_pattern, content)
if match:
    coord_div_str = match.group(1)
    content = content.replace(coord_div_str, " ")
    
    # Insert before the Sub-Events Toggle
    # <div style={s(styles.formGroup, { marginTop: '1rem'
    sub_events_toggle = r'({\/\*\s*Sub-Events Toggle\s*\*\/})'
    content = re.sub(sub_events_toggle, coord_div_str + r'\1', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed syntax errors.")
