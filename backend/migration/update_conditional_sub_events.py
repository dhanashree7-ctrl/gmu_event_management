import os

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
    set_call = "handleFieldChange('sub_events', newSubs);" if state_var == "form" else f"setFormData({{{state_var}, sub_events: newSubs}});"

    bad_input = """                            <input
                              type="number"
                              value={sub.max_participants || ''}
                              onChange={(e) => {
                                const newSubs = [...""" + state_var + """.sub_events];
                                newSubs[idx].max_participants = e.target.value;
                                """ + set_call + """
                              }}
                              placeholder="Max Participants"
                              style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                            />"""

    good_inputs = """                            {sub.participation_type === 'group' ? (
                              <>
                                <input
                                  type="number"
                                  value={sub.max_groups || ''}
                                  onChange={(e) => {
                                    const newSubs = [...""" + state_var + """.sub_events];
                                    newSubs[idx].max_groups = e.target.value;
                                    """ + set_call + """
                                  }}
                                  placeholder="Max Groups"
                                  style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                                />
                                <input
                                  type="number"
                                  value={sub.max_team_size || ''}
                                  onChange={(e) => {
                                    const newSubs = [...""" + state_var + """.sub_events];
                                    newSubs[idx].max_team_size = e.target.value;
                                    """ + set_call + """
                                  }}
                                  placeholder="Max per Group"
                                  style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                                />
                              </>
                            ) : (
                              <input
                                type="number"
                                value={sub.max_participants || ''}
                                onChange={(e) => {
                                  const newSubs = [...""" + state_var + """.sub_events];
                                  newSubs[idx].max_participants = e.target.value;
                                  """ + set_call + """
                                }}
                                placeholder="Max Participants"
                                style={Object.assign({}, styles.formInput, { padding: '8px', flex: 1 })}
                              />
                            )}"""

    content = content.replace(bad_input, good_inputs)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated sub_events conditionally.")
