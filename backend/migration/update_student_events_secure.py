import os

file_path = 'frontend/src/pages/StudentEvents.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Main Coordinator in Modal
# We look for the venue in the modal:
# <p style={{ margin: 0 }}>
#   <strong>Venue:</strong> {selectedEvent.VENUE || 'TBA'}
# </p>
modal_venue = """                  <p style={{ margin: 0 }}>
                    <strong>Venue:</strong> {selectedEvent.VENUE || 'TBA'}
                  </p>"""

modal_coordinator = """                  <p style={{ margin: 0 }}>
                    <strong>Venue:</strong> {selectedEvent.VENUE || 'TBA'}
                  </p>
                  {selectedEvent.details?.coordinator_name && (
                    <p style={{ margin: '0.5rem 0 0 0' }}>
                      <strong>Main Coordinator:</strong> {selectedEvent.details.coordinator_name}
                    </p>
                  )}"""

if "Main Coordinator:" not in content:
    content = content.replace(modal_venue, modal_coordinator)


# 2. Sub-Event Coordinator & Meta in Modal
# We look for:
#                          {sub.description && <p style={styles.subEventDesc}>{sub.description}</p>}
#                          <div style={styles.subEventMeta}>

sub_event_meta_old = """                         {sub.description && <p style={styles.subEventDesc}>{sub.description}</p>}
                         <div style={styles.subEventMeta}>"""

sub_event_meta_new = """                         {sub.description && <p style={styles.subEventDesc}>{sub.description}</p>}
                         <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#555' }}>
                           {sub.coordinator_name && <div style={{ marginBottom: '0.25rem' }}><strong>Coordinator:</strong> {sub.coordinator_name}</div>}
                           <div style={{ marginBottom: '0.25rem' }}>
                             <strong>Participation:</strong> {sub.participation_type === 'group' ? 'Group' : 'Solo'}
                           </div>
                           {sub.participation_type === 'group' ? (
                             <div style={{ marginBottom: '0.25rem' }}>
                               <strong>Limits:</strong> {sub.max_groups || 'N/A'} Groups (Max {sub.max_team_size || 'N/A'} per group)
                             </div>
                           ) : (
                             sub.max_participants && (
                               <div style={{ marginBottom: '0.25rem' }}>
                                 <strong>Max Participants:</strong> {sub.max_participants}
                               </div>
                             )
                           )}
                         </div>
                         <div style={styles.subEventMeta}>"""

if "<strong>Participation:</strong>" not in content:
    content = content.replace(sub_event_meta_old, sub_event_meta_new)


# 3. List view Event Coordinator
# We look for:
# <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#555' }}>
#   <strong>Venue:</strong> {evt.VENUE || 'TBA'}
# </p>

list_venue_old = """                  <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#555' }}>
                    <strong>Venue:</strong> {evt.VENUE || 'TBA'}
                  </p>"""

list_venue_new = """                  <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#555' }}>
                    <strong>Venue:</strong> {evt.VENUE || 'TBA'}
                  </p>
                  {evt.details?.coordinator_name && (
                    <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#555' }}>
                      <strong>Coordinator:</strong> {evt.details.coordinator_name}
                    </p>
                  )}"""

# If not applied, apply it
if content.count(list_venue_new) == 0:
    content = content.replace(list_venue_old, list_venue_new)


# 4. Checkbox area (Registration form)
# We look for:
#                            <span style={{ fontSize: '0.75rem', color: '#666' }}>📍 {sub.venue || 'TBA'} • ⏰ {sub.start_time || 'TBA'} - {sub.end_time || 'TBA'}</span>

checkbox_old = """                            <span style={{ fontSize: '0.75rem', color: '#666' }}>📍 {sub.venue || 'TBA'} • ⏰ {sub.start_time || 'TBA'} - {sub.end_time || 'TBA'}</span>"""

checkbox_new = """                            <span style={{ fontSize: '0.75rem', color: '#666' }}>📍 {sub.venue || 'TBA'} • ⏰ {sub.start_time || 'TBA'} - {sub.end_time || 'TBA'}</span>
                            <span style={{ fontSize: '0.75rem', color: '#444', marginTop: '2px' }}>
                              {sub.participation_type === 'group' 
                                ? `Group (Max ${sub.max_groups || 'N/A'} Teams, ${sub.max_team_size || 'N/A'} per Team)` 
                                : `Solo ${sub.max_participants ? `(Max ${sub.max_participants})` : ''}`}
                            </span>"""

if "Group (Max" not in content:
    content = content.replace(checkbox_old, checkbox_new)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated StudentEvents.js securely.")
