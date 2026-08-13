import os

file_path = 'frontend/src/pages/StudentEvents.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update EventCard
old_buttons = """        <button
          style={s(
            styles.registerBtn,
            isRegistered && {
              background: theme.colors.gold,
              color: theme.colors.maroon,
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
            }
          )}
          onClick={() => isRegistered ? onViewTicket(evt) : onSelect(evt)}
          onMouseEnter={(e) => {
            if (isRegistered) {
              e.currentTarget.style.transform = "translateY(-1px)";
              return;
            }
            e.currentTarget.style.background = "#A31621";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(128,0,0,0.4)";
          }}
          onMouseLeave={(e) => {
            if (isRegistered) {
              e.currentTarget.style.transform = "none";
              return;
            }
            e.currentTarget.style.background = theme.colors.maroon;
            e.currentTarget.style.boxShadow = "0 2px 4px rgba(128,0,0,0.3)";
          }}
        >
          {isRegistered ? "\U0001f3ab View Ticket" : "\U0001f39f\ufe0f View Details"}
        </button>"""

new_buttons = """        {isRegistered && (
          <button
            style={s(styles.registerBtn, { background: '#f0f0f0', color: '#333', marginBottom: '0.5rem', boxShadow: 'none', border: '1px solid #ccc' })}
            onClick={() => onSelect(evt)}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f0f0f0'}
          >
            \U0001f39f\ufe0f View Details
          </button>
        )}
        <button
          style={s(
            styles.registerBtn,
            isRegistered && {
              background: theme.colors.gold,
              color: theme.colors.maroon,
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
            }
          )}
          onClick={() => isRegistered ? onViewTicket(evt) : onSelect(evt)}
          onMouseEnter={(e) => {
            if (isRegistered) {
              e.currentTarget.style.transform = "translateY(-1px)";
              return;
            }
            e.currentTarget.style.background = "#A31621";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(128,0,0,0.4)";
          }}
          onMouseLeave={(e) => {
            if (isRegistered) {
              e.currentTarget.style.transform = "none";
              return;
            }
            e.currentTarget.style.background = theme.colors.maroon;
            e.currentTarget.style.boxShadow = "0 2px 4px rgba(128,0,0,0.3)";
          }}
        >
          {isRegistered ? "\U0001f3ab View Ticket" : "\U0001f39f\ufe0f View Details"}
        </button>"""

if "marginBottom: '0.5rem'" not in content:
    content = content.replace(old_buttons, new_buttons)

# 2. Update Modal Button
old_modal_btn = """                 <button 
                   style={s(styles.registerBtn, { width: '100%', padding: '1rem', fontSize: '1.1rem' })}
                   onClick={() => openRegistration(selectedEvent)}
                 >
                   Register Now
                 </button>"""

new_modal_btn = """                 { (registeredEvents.includes(selectedEvent.id) || selectedEvent.is_registered) ? (
                   <button 
                     style={s(styles.registerBtn, { width: '100%', padding: '1rem', fontSize: '1.1rem', background: theme.colors.gold, color: theme.colors.maroon })}
                     onClick={() => {
                        setShowDetails(false);
                        if (!selectedEvent.qr_token) {
                          alert("Ticket not available yet.");
                          return;
                        }
                        setTicketData(selectedEvent.qr_token);
                     }}
                   >
                     \U0001f3ab View Ticket
                   </button>
                 ) : (
                   <button 
                     style={s(styles.registerBtn, { width: '100%', padding: '1rem', fontSize: '1.1rem' })}
                     onClick={() => openRegistration(selectedEvent)}
                   >
                     Register Now
                   </button>
                 )}"""

if "registeredEvents.includes(selectedEvent.id) || selectedEvent.is_registered" not in content:
    content = content.replace(old_modal_btn, new_modal_btn)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated view details buttons in StudentEvents.js")
