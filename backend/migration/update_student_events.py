import os
import re

file_path = 'frontend/src/pages/StudentEvents.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add main event coordinator display
# Search for the Venue display in the Modal (around line 348)
venue_pattern = r'(<p style={{ margin: 0 }}>\s*<strong>Venue:</strong> \{selectedEvent\.VENUE || \'TBA\'\}\s*</p>)'
if "Main Coordinator:" not in content:
    main_coordinator_ui = r'\1\n                {selectedEvent.details?.coordinator_name && (\n                  <p style={{ margin: 0, marginTop: "0.5rem" }}>\n                    <strong>Main Coordinator:</strong> {selectedEvent.details.coordinator_name}\n                  </p>\n                )}'
    content = re.sub(venue_pattern, main_coordinator_ui, content)

# 2. Add sub-event coordinator display
# Sub-events are rendered inside a map, e.g., <h5 style={{ margin: '0 0 0.25rem', color: theme.colors.maroon, fontSize: '1rem' }}>{sub.name}</h5>
sub_title_pattern = r'(<h5 style=\{\{ margin: \'0 0 0\.25rem\', color: theme\.colors\.maroon, fontSize: \'1rem\' \}\}>\{sub\.name\}</h5>)'
if "Coordinator:</strong> {sub.coordinator_name}" not in content:
    sub_coordinator_ui = r'\1\n                          {sub.coordinator_name && (\n                            <p style={{ fontSize: "0.85rem", margin: "0.25rem 0", color: "#555" }}>\n                              <strong>Coordinator:</strong> {sub.coordinator_name}\n                            </p>\n                          )}'
    content = re.sub(sub_title_pattern, sub_coordinator_ui, content)

# 3. Add to the Sub-events in the main list view
# The events in the list view are mapped, we can display the main coordinator there too
event_list_venue = r'(<p style=\{\{ margin: \'0\.2rem 0\', fontSize: \'0\.85rem\', color: \'#555\' \}\}>\s*<strong>Venue:</strong> \{evt\.VENUE || \'TBA\'\}\s*</p>)'
if "Main Coordinator:" not in content.split("Venue:")[0]: # Rough check
    list_coordinator_ui = r'\1\n                  {evt.details?.coordinator_name && (\n                    <p style={{ margin: "0.2rem 0", fontSize: "0.85rem", color: "#555" }}>\n                      <strong>Main Coordinator:</strong> {evt.details.coordinator_name}\n                    </p>\n                  )}'
    content = re.sub(event_list_venue, list_coordinator_ui, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated StudentEvents.js")
