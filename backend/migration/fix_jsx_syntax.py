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

    # Step 1: Remove the badly placed {!(form.is_festival) && (<> and </>)}
    bad_start = "{!(" + state_var + ".is_festival) && (<>"
    bad_end = "</>)}"
    
    content = content.replace(bad_start + "\n\n", "")
    content = content.replace(bad_start + "\n", "")
    content = content.replace(bad_start, "")
    content = content.replace("\n                " + bad_end, "")
    content = content.replace(bad_end, "")

    # Step 2: Inject them at the correct positions inside <div style={styles.formRow}>
    
    # We want to place {!(form.is_festival) && (<> right before <div style={styles.formGroup}>\n                    <label style={styles.formLabel}>\n                      Participation Type
    # Wait, the exact string for the participation type formGroup is:
    participation_group_start = f"""                  <div style={{styles.formGroup}}>
                    <label style={{styles.formLabel}}>
                      Participation Type"""
    
    participation_group_new = f"""                  {{!({state_var}.is_festival) && (<>
                  <div style={{styles.formGroup}}>
                    <label style={{styles.formLabel}}>
                      Participation Type"""

    if participation_group_start in content and "{!(" not in content:
        content = content.replace(participation_group_start, participation_group_new)
        
        # Now we need to place </>)} right before {/* Start Time */}
        # Currently it looks like:
        #                  )}
        #
        #                  {/* Start Time */}
        
        start_time_comment = "                  {/* Start Time */}"
        start_time_new = "                  </>)}\n" + start_time_comment
        content = content.replace(start_time_comment, start_time_new)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed syntax errors by placing conditions correctly.")
