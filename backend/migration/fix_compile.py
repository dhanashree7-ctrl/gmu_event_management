import re

# 1. ExecutiveDashboard.js
fpath = 'frontend/src/pages/ExecutiveDashboard.js'
with open(fpath, 'r', encoding='utf-8') as f: content = f.read()
content = content.replace("formData.append('coordinator_name', form.coordinator_name);", "if (formData.coordinator_name) formData.append('coordinator_name', formData.coordinator_name);")
with open(fpath, 'w', encoding='utf-8') as f: f.write(content)

# 2. HODDashboard.js
fpath = 'frontend/src/pages/HODDashboard.js'
with open(fpath, 'r', encoding='utf-8') as f: content = f.read()
content = content.replace("formData.append('coordinator_name', form.coordinator_name);", "if (formData.coordinator_name) formData.append('coordinator_name', formData.coordinator_name);")
with open(fpath, 'w', encoding='utf-8') as f: f.write(content)

# 3. FacultyDashboard.js
# The broken string is:
# ? ' Venue is required for offline events (set during logistics).'
# Wait, let's just check what it is.
fpath = 'frontend/src/pages/FacultyDashboard.js'
with open(fpath, 'r', encoding='utf-8') as f: content = f.read()

# Let's fix the multi-line string.
# We will just replace it cleanly.
bad_str = """? '
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Main Coordinator Name</label>
                          <input style={styles.formInput} type="text" name="coordinator_name" placeholder="e.g. Dr. Smith" value={form.coordinator_name || ''} onChange={(e) => handleFieldChange("coordinator_name", e.target.value)} />
                        </div>
Venue is required for offline events (set during logistics).'"""

good_str = "? 'Venue is required for offline events (set during logistics).'"
content = content.replace(bad_str, good_str)
content = content.replace("? ' Venue is required for offline events (set during logistics).'", good_str)
with open(fpath, 'w', encoding='utf-8') as f: f.write(content)


# 4. StudentAffairsDashboard.js
fpath = 'frontend/src/pages/StudentAffairsDashboard.js'
with open(fpath, 'r', encoding='utf-8') as f: content = f.read()

# Let's just restore the date input correctly
bad_str = """                  <input
                    
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Main Coordinator Name</label>
                          <input style={styles.formInput} type="text" name="coordinator_name" placeholder="e.g. Dr. Smith" value={form.coordinator_name || ''} onChange={(e) => handleFieldChange("coordinator_name", e.target.value)} />
                        </div>
id="date"
                    type="date"
                    value={form.date}"""

good_str = """                  <input
                    id="date"
                    type="date"
                    value={form.date}"""
content = content.replace(bad_str, good_str)
bad_str_2 = """                  <input
                     id="date"
                    type="date"
                    value={form.date}"""
content = content.replace(bad_str_2, good_str)
with open(fpath, 'w', encoding='utf-8') as f: f.write(content)

# 5. StudentEvents.js
fpath = 'frontend/src/pages/StudentEvents.js'
with open(fpath, 'r', encoding='utf-8') as f: content = f.read()

# I messed up the regex.
# Let's just fix line 66 manually.
# Actually I'll run a shell script to see what it is.
