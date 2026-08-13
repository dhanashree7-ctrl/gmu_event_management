import React, { useState, useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { API_BASE } from "../config/api";
import theme from "../theme";
import { useAuth } from "../context/AuthContext";
import CertificateGenerator from "../components/CertificateGenerator";

// ── Utility ──────────────────────────────────────────────────────────────────
const s = (...styles) => Object.assign({}, ...styles);

const CATEGORY_COLORS = {
  University: { bg: "#EDE7F6", color: "#512DA8" },
  Academic:    { bg: "#E3F2FD", color: "#1565C0" },
  Department:  { bg: "#FFF8E1", color: "#F57F17" },
  Workshop:    { bg: "#E8F5E9", color: "#2E7D32" },
};

function getCategoryStyle(cat) {
  return CATEGORY_COLORS[cat] ?? { bg: "#F5F5F5", color: "#555" };
}

function formatDate(dateStr) {
  if (!dateStr) return "TBD";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "TBD";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = ((hour % 12) || 12) + ":" + m;
  return `${display} ${ampm}`;
}

// ── EventCard ────────────────────────────────────────────────────────────
function EventCard({ evt, onBrochure, onSelect, onViewTicket, isRegistered }) {
  const [hovered, setHovered] = useState(false);
  const catStyle = getCategoryStyle(evt.category);

  return (
    <div
      style={s(styles.card, hovered && styles.cardHovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.cardAccent} />
      <div style={styles.cardBody}>
        <span style={s(styles.categoryChip, { background: catStyle.bg, color: catStyle.color })}>
          {evt.category}
        </span>
        <h3 style={styles.cardTitle}>{evt.event_title}</h3>
        {evt.description && <p style={styles.cardDesc}>{evt.description}</p>}
        <div style={styles.metaRow}>
          {(evt.event_mode === 'online' || evt.venue) && (
            <span style={styles.metaItem}>📍 {evt.event_mode === 'online' ? 'Online' : evt.venue}</span>
          )}
          <span style={styles.metaItem}>📅 {formatDate(evt.event_date)}</span>
          {evt.event_time && (
            <span style={styles.metaItem}>🕐 {formatTime(evt.event_time)}</span>
          )}
          {evt.registration_deadline && (
            <span style={s(styles.metaItem, { color: theme.colors.maroon, fontWeight: 600 })}>
              ⏳ Register By: {formatDate(evt.registration_deadline)} {formatTime(new Date(evt.registration_deadline).toTimeString().substring(0,5))}
            </span>
          )}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            background: evt.event_mode === 'online' ? '#E3F2FD' : '#F3E5F5',
            color: evt.event_mode === 'online' ? '#1565C0' : '#6A1B9A',
            borderRadius: '12px', padding: '0.15rem 0.6rem',
            fontSize: '0.75rem', fontWeight: 600
          }}>
            {evt.event_mode === 'online' ? '💻 Online' : '🏢 Offline'}
          </span>
        </div>

      </div>
      <div style={styles.cardFooter}>
        {evt.brochure_path && (
          <button
            style={styles.brochureBtn}
            onClick={() => onBrochure(evt)}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F0EDE8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            📄 View Brochure
          </button>
        )}
        {isRegistered && (
          <button
            style={s(styles.registerBtn, { background: '#f0f0f0', color: '#333', marginBottom: '0.5rem', boxShadow: 'none', border: '1px solid #ccc' })}
            onClick={() => onSelect(evt)}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f0f0f0'}
          >
            🎟️ View Details
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
          {isRegistered ? "🎫 View Ticket" : "🎟️ View Details"}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StudentEvents() {
  const { user } = useAuth();
  
  // Certificate Ref
  const certificateRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [registeredEvents, setRegisteredEvents] = useState([]);

  // Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [form, setForm] = useState({ semester: "", special_requirements: "", reg_role: "participant", selectedSubEvents: [], is_team_lead: true, team_lead_name: "", team_members: [] });
  const [registering, setRegistering] = useState(false);
  
  // Ticket State
  const [ticketData, setTicketData] = useState(null);

  // Tabs & Past Events State
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [pastEvents, setPastEvents] = useState([]);
  const [pastLoading, setPastLoading] = useState(false);

  // Feedback State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackEventId, setFeedbackEventId] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComments, setFeedbackComments] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/get_published_events.php?student_id=${user.username}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setEvents(json.data);
        } else {
          setError(json.message || "Could not load events.");
        }
      } catch (err) {
        setError("Cannot reach the server. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [user.username]);

  useEffect(() => {
    if (activeTab === "Past") {
      const fetchPastEvents = async () => {
        setPastLoading(true);
        try {
          const res = await fetch(`${API_BASE}/get_attended_events.php?student_id=${user.username}`);
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setPastEvents(json.data);
          }
        } catch (err) {
          console.error("Error fetching past events:", err);
        } finally {
          setPastLoading(false);
        }
      };
      fetchPastEvents();
    }
  }, [activeTab, user.username]);

  const handleBrochure = (evt) => {
    const brochurePath = evt.brochure_path.startsWith("uploads/") ? evt.brochure_path : `uploads/${evt.brochure_path}`;
    const url = `${API_BASE}/${brochurePath}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openDetails = (evt) => {
    setSelectedEvent(evt);
    setShowDetails(true);
  };

  const openRegistration = (evt = selectedEvent) => {
    setSelectedEvent(evt);
    setForm({ semester: "", special_requirements: "", reg_role: "participant", selectedSubEvents: [], is_team_lead: true, team_lead_name: "", team_members: [] });
    setTicketData(null);
    setShowDetails(false);
    setShowModal(true);
  };

  const openTicketModal = (evt) => {
    setSelectedEvent(evt);
    setTicketData(evt.qr_token);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowDetails(false);
    setSelectedEvent(null);
    setTicketData(null);
  };

  const downloadQR = () => {
    const canvas = document.getElementById("qr-canvas");
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `ticket-${selectedEvent?.id || 'event'}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const submitRegistration = async (e) => {
    e.preventDefault();
    setRegistering(true);
    
    // Validate Sub-Events if festival
    const hasSubEvents = selectedEvent?.details?.is_festival && (selectedEvent.details?.sub_events_logistics?.length > 0 || selectedEvent.details?.sub_events?.length > 0);
    if (hasSubEvents && form.selectedSubEvents.length === 0) {
      alert("Please select at least one sub-event to attend.");
      setRegistering(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/register_for_event.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: selectedEvent.id,
          student_id: user.username,
          role: form.reg_role,
          semester: form.semester,
          special_requirements: form.special_requirements,
          selected_sub_events: form.selectedSubEvents,
          is_team_lead: form.is_team_lead,
          team_lead: form.team_lead_name,
          team_members: form.team_members
        }),
      });
      const data = await response.json();
      if (data.success) {
        setRegisteredEvents((prev) => [...prev, selectedEvent.id]);
        setTicketData(data.qr_token);
        setEvents((prev) => prev.map(e =>
          e.id === selectedEvent.id
            ? { ...e, is_registered: true, qr_token: data.qr_token, my_role: data.role }
            : e
        ));
      } else {
        alert("Notice: " + data.message);
      }
    } catch (error) {
      alert("Error: Could not connect to the server.");
    } finally {
      setRegistering(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (feedbackRating < 1 || feedbackRating > 5) {
      alert("Please select a rating between 1 and 5 stars.");
      return;
    }

    setSubmittingFeedback(true);
    try {
      const response = await fetch(`${API_BASE}/submit_feedback.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: feedbackEventId,
          student_id: user?.username,
          rating: feedbackRating,
          comments: feedbackComments
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert("Feedback submitted successfully!");
        setFeedbackModalOpen(false);
        setFeedbackRating(0);
        setFeedbackComments("");
        
        // Update local state to reflect submission
        setPastEvents(prev => prev.map(evt => 
          evt.id === feedbackEventId ? { ...evt, has_feedback: true } : evt
        ));
      } else {
        alert("Notice: " + data.message);
      }
    } catch (error) {
      alert("Error submitting feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Filter logic
  const PINNED_CATEGORIES = ["University", "Academic", "Department"];
  const dynamicCategories = [...new Set(events.map((e) => e.category))];
  const categories = ["All", ...PINNED_CATEGORIES, ...dynamicCategories.filter((c) => !PINNED_CATEGORIES.includes(c))];

  const filtered = events.filter((e) => {
    const matchesSearch = e.event_title.toLowerCase().includes(search.toLowerCase()) || e.venue?.toLowerCase().includes(search.toLowerCase());
    
    let matchesCat = false;
    if (activeCategory === "All") {
      matchesCat = true;
    } else if (activeCategory === "University") {
      matchesCat = e.event_scale === "university";
    } else if (activeCategory === "Department") {
      matchesCat = e.event_scale === "department";
    } else {
      matchesCat = e.category === activeCategory;
    }

    return matchesSearch && matchesCat;
  });

  return (
    <>
      <div style={styles.tabContainer}>
        <button
          style={s(styles.tabBtn, activeTab === "Upcoming" && styles.tabBtnActive)}
          onClick={() => setActiveTab("Upcoming")}
        >
          Upcoming Events
        </button>
        <button
          style={s(styles.tabBtn, activeTab === "Past" && styles.tabBtnActive)}
          onClick={() => setActiveTab("Past")}
        >
          Past Attended
        </button>
      </div>

      {showDetails && selectedEvent ? (
        <div style={styles.detailsContainer}>
           <button onClick={() => setShowDetails(false)} style={styles.backBtn}>
             ← Back to Events
           </button>
           <div style={styles.detailsHeader}>
              <span style={s(styles.categoryChip, { background: getCategoryStyle(selectedEvent.category).bg, color: getCategoryStyle(selectedEvent.category).color })}>{selectedEvent.category}</span>
              <h1 style={styles.detailsTitle}>{selectedEvent.event_title}</h1>
              <p style={styles.detailsOrg}>Organized by: <strong>{selectedEvent.proposed_by_dept || 'University'}</strong></p>
           </div>
           
           <div style={styles.detailsBody}>
             <div style={styles.detailsMain}>
               <h3 style={styles.sectionTitle}>Eligibility</h3>
               <div style={styles.metaRow}>
                 <span style={styles.metaItem}>📍 {selectedEvent.event_mode === 'online' ? 'Online' : (selectedEvent.venue || 'TBD')}</span>
                 <span style={styles.metaItem}>🎓 Eligibility: {selectedEvent.event_scale === 'department' ? `${selectedEvent.proposer_dept} Students Only` : 'All University Students'}</span>
               </div>
               
               <h3 style={styles.sectionTitle}>All that you need to know about</h3>
               <p style={styles.detailsText}>{selectedEvent.description}</p>
               
               {selectedEvent.details?.is_festival && (selectedEvent.details?.sub_events_logistics?.length > 0 || selectedEvent.details?.sub_events?.length > 0) && (
                 <>
                   <h3 style={styles.sectionTitle}>Stages and Timelines</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                     {(selectedEvent.details.sub_events_logistics || selectedEvent.details.sub_events).map((sub, idx) => (
                       <div key={idx} style={styles.subEventCard}>
                         <h4 style={styles.subEventTitle}>{sub.name}</h4>
                         {sub.description && <p style={styles.subEventDesc}>{sub.description}</p>}
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
                         <div style={styles.subEventMeta}>
                           <span>📍 {sub.venue || 'TBD'}</span>
                           <span>🕐 {sub.start_time ? formatTime(sub.start_time) : 'TBD'} - {sub.end_time ? formatTime(sub.end_time) : 'TBD'}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </>
               )}
               
               {selectedEvent.details?.rewards && (
                 <>
                   <h3 style={styles.sectionTitle}>Rewards and Prizes</h3>
                   <div style={styles.subEventCard}>
                     <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#444', lineHeight: 1.6 }}>
                       🎁 {selectedEvent.details.rewards}
                     </p>
                   </div>
                 </>
               )}
             </div>
             
             <div style={styles.detailsSidebar}>
               <div style={styles.registerCard}>
                 <h3 style={{ marginTop: 0, color: '#333' }}>Important dates & deadlines</h3>
                 <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                   {selectedEvent.registration_deadline && (
                     <p style={{ color: '#D32F2F', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
                       Registration Deadline: {formatDate(selectedEvent.registration_deadline)}
                     </p>
                   )}
                   <p style={{ color: '#555', fontSize: '0.9rem', margin: 0 }}>
                     Event Date: {formatDate(selectedEvent.event_date)}
                   </p>
                   {selectedEvent.event_time && (
                     <p style={{ color: '#555', fontSize: '0.9rem', margin: 0 }}>
                       Event Time: {formatTime(selectedEvent.event_time)}
                     </p>
                   )}
                 </div>
                 { (registeredEvents.includes(selectedEvent.id) || selectedEvent.is_registered) ? (
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
                     🎫 View Ticket
                   </button>
                 ) : (
                   <button 
                     style={s(styles.registerBtn, { width: '100%', padding: '1rem', fontSize: '1.1rem' })}
                     onClick={() => openRegistration(selectedEvent)}
                   >
                     Register Now
                   </button>
                 )}
               </div>
             </div>
           </div>
        </div>
      ) : activeTab === "Upcoming" ? (
        <>
          <div style={styles.toolbar}>
            <div style={styles.searchWrap}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search events or venues…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <div style={styles.filterRow}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  style={s(styles.filterBtn, activeCategory === cat && styles.filterBtnActive)}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={styles.centreState}>
              <div style={styles.spinner} />
              <p style={styles.stateText}>Loading events…</p>
            </div>
          ) : error ? (
            <div style={styles.centreState}>
              <span style={{ fontSize: "2.5rem" }}>⚠️</span>
              <p style={styles.stateText}>{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={styles.centreState}>
              <span style={{ fontSize: "3rem" }}>📭</span>
              <p style={styles.stateText}>No events match your search.</p>
            </div>
          ) : (
            <>
              <p style={styles.resultCount}>Showing {filtered.length} event{filtered.length !== 1 ? "s" : ""}</p>
              <div style={styles.grid}>
                {filtered.map((evt) => (
                  <EventCard
                    key={evt.id}
                    evt={evt}
                    onBrochure={handleBrochure}
                    onSelect={openDetails}
                    onViewTicket={openTicketModal}
                    isRegistered={registeredEvents.includes(evt.id) || evt.is_registered}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : activeTab === "Past" ? (
        <>
          {pastLoading ? (
            <div style={styles.centreState}>
              <div style={styles.spinner} />
              <p style={styles.stateText}>Loading past events…</p>
            </div>
          ) : pastEvents.length === 0 ? (
            <div style={styles.centreState}>
              <span style={{ fontSize: "3rem" }}>🎓</span>
              <p style={styles.stateText}>You haven't attended any completed events yet.</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {pastEvents.map((evt) => (
                <div key={evt.id} style={styles.card}>
                  <div style={styles.cardAccent} />
                  <div style={styles.cardBody}>
                    <span style={s(styles.categoryChip, { background: getCategoryStyle(evt.category).bg, color: getCategoryStyle(evt.category).color })}>
                      {evt.category}
                    </span>
                    <h3 style={styles.cardTitle}>{evt.event_title}</h3>
                    {evt.description && <p style={styles.cardDesc}>{evt.description}</p>}
                    <div style={styles.metaRow}>
                      {evt.venue && <span style={styles.metaItem}>📍 {evt.venue}</span>}
                      <span style={styles.metaItem}>📅 {formatDate(evt.event_date)}</span>
                    </div>
                  </div>
                  <div style={styles.cardFooter}>
                    <button
                      style={s(
                        styles.registerBtn,
                        evt.has_feedback && {
                          background: "#E0E0E0",
                          color: "#757575",
                          boxShadow: "none",
                          cursor: "not-allowed",
                        }
                      )}
                      onClick={() => {
                        setFeedbackEventId(evt.id);
                        setFeedbackRating(0);
                        setFeedbackComments("");
                        setFeedbackModalOpen(true);
                      }}
                      disabled={evt.has_feedback}
                    >
                      {evt.has_feedback ? "Feedback Submitted ✓" : "Leave Feedback ⭐"}
                    </button>
                    <button
                      style={{
                        ...styles.registerBtn,
                        marginTop: "8px",
                        background: "#1565C0",
                      }}
                      onClick={() => {
                        if (certificateRef.current) {
                          certificateRef.current.generateCertificate(
                            user?.name || user?.username,
                            evt.event_title,
                            formatDate(evt.event_date)
                          );
                        }
                      }}
                    >
                      Download Certificate 🎓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button style={styles.closeBtn} onClick={closeModal}>✕</button>
            
            {ticketData ? (
              <div style={styles.ticketContainer}>
                <div style={styles.ticketHeader}>
                  <h2 style={{margin: 0, fontSize: "1.2rem", letterSpacing: "0.1em"}}>BOARDING PASS</h2>
                  <p style={{margin: 0, fontSize: "0.8rem", textTransform: "uppercase"}}>Admit One</p>
                </div>
                <div style={styles.ticketBody}>
                  <h3 style={styles.ticketTitle}>{selectedEvent.event_title}</h3>
                  <div style={styles.ticketMeta}>
                    <div style={{flex: 1}}>
                      <p style={styles.ticketLabel}>DATE</p>
                      <p style={styles.ticketVal}>{formatDate(selectedEvent.event_date)}</p>
                    </div>
                    <div style={{flex: 1, textAlign: "right"}}>
                      <p style={styles.ticketLabel}>TIME</p>
                      <p style={styles.ticketVal}>{formatTime(selectedEvent.event_time)}</p>
                    </div>
                  </div>
                  <div style={styles.ticketMeta}>
                    <div style={{flex: 1}}>
                      <p style={styles.ticketLabel}>VENUE</p>
                      <p style={styles.ticketVal}>{selectedEvent.venue}</p>
                    </div>
                    <div style={{flex: 1, textAlign: "right"}}>
                      <p style={styles.ticketLabel}>STUDENT</p>
                      <p style={styles.ticketVal}>{user?.full_name || user?.name || "Student"}</p>
                    </div>
                  </div>
                  <div style={styles.ticketMeta}>
                    <div style={{flex: 1}}>
                      <p style={styles.ticketLabel}>ROLE</p>
                      <p style={styles.ticketVal}>
                        {selectedEvent?.my_role === 'volunteer' ? '🙋 Volunteer'
                          : selectedEvent?.my_role === 'coordinator' ? '🎤 Coordinator'
                          : '🎟️ Participant'}
                      </p>
                    </div>
                  </div>
                  
                  {selectedEvent?.reg_details?.registered_sub_events && selectedEvent.reg_details.registered_sub_events.length > 0 && (
                    <div style={{...styles.ticketMeta, flexDirection: 'column'}}>
                      <p style={styles.ticketLabel}>REGISTERED SUB-EVENTS</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                        {selectedEvent.reg_details.registered_sub_events.map((sub, idx) => (
                          <span key={idx} style={{ background: '#E3F2FD', color: '#1565C0', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div style={styles.qrSection}>
                    <QRCodeCanvas id="qr-canvas" value={ticketData} size={150} level={"H"} />
                    <p style={styles.qrCodeText}>{ticketData}</p>
                    <button 
                      onClick={downloadQR} 
                      style={{ 
                        marginTop: "1rem", 
                        padding: "8px 16px", 
                        backgroundColor: theme.colors.maroon, 
                        color: theme.colors.gold, 
                        border: "none", 
                        borderRadius: "20px", 
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      Download Ticket QR
                    </button>
                  </div>
                  <p style={styles.ticketFooter}>Present this code at the entrance.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={submitRegistration} style={styles.formContainer}>
                <h2 style={styles.modalTitle}>Register for {selectedEvent.event_title}</h2>
                <p style={styles.modalSub}>Please provide a few details to complete your registration.</p>

                {/* Role Selector */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Register As *</label>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {[
                      { key: 'participant', icon: '🎟️', desc: 'Attend the event' },
                      { key: 'volunteer',   icon: '🙋', desc: 'Help run the event' }
                    ].map(r => {
                      const slotInfo = selectedEvent.slots?.[r.key];
                      const isFull   = slotInfo !== null && slotInfo !== undefined && slotInfo <= 0;
                      const isActive = form.reg_role === r.key;
                      return (
                        <button
                          key={r.key}
                          type="button"
                          disabled={isFull}
                          onClick={() => !isFull && setForm({ ...form, reg_role: r.key })}
                          style={{
                            flex: 1,
                            minWidth: '90px',
                            padding: '0.6rem 0.5rem',
                            borderRadius: '12px',
                            border: `2px solid ${isActive ? theme.colors.maroon : '#ddd'}`,
                            background: isActive ? theme.colors.maroon : isFull ? '#f5f5f5' : '#fff',
                            color: isActive ? '#fff' : isFull ? '#bbb' : '#444',
                            cursor: isFull ? 'not-allowed' : 'pointer',
                            textAlign: 'center',
                            fontSize: '0.82rem',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ fontSize: '1.3rem' }}>{r.icon}</div>
                          <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{r.key}</div>
                          <div style={{ fontSize: '0.72rem', opacity: 0.75 }}>{r.desc}</div>
                          {slotInfo !== null && slotInfo !== undefined && (
                            <div style={{ fontSize: '0.7rem', marginTop: '2px', fontWeight: 600, color: isFull ? '#e53935' : '#2e7d32' }}>
                              {isFull ? 'Full' : `${slotInfo} left`}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-Events Selection (if Festival) */}
                {selectedEvent?.details?.is_festival && (selectedEvent.details?.sub_events_logistics?.length > 0 || selectedEvent.details?.sub_events?.length > 0) && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Select Sub-Events to Attend *</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      {(selectedEvent.details.sub_events_logistics || selectedEvent.details.sub_events).map((sub, idx) => (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #E0E0E0' }}>
                          <input
                            type="checkbox"
                            checked={form.selectedSubEvents.includes(sub.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, selectedSubEvents: [...form.selectedSubEvents, sub.name] });
                              } else {
                                setForm({ ...form, selectedSubEvents: form.selectedSubEvents.filter(s => s !== sub.name) });
                              }
                            }}
                            style={{ width: '16px', height: '16px', accentColor: theme.colors.maroon }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: theme.colors.charcoal }}>{sub.name}</span>
                            <span style={{ fontSize: '0.75rem', color: '#666' }}>📍 {sub.venue || 'TBA'} • 🕐 {sub.start_time || 'TBA'} - {sub.end_time || 'TBA'}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Group Registration Details */}
                {selectedEvent?.participation_type === 'group' && form.reg_role === 'participant' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Group Registration Details *</label>
                    <div style={{ background: '#f5f7fa', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '1rem', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={form.is_team_lead}
                          onChange={(e) => {
                            setForm({ ...form, is_team_lead: e.target.checked, team_lead_name: '', team_members: [] });
                          }}
                          style={{ width: '16px', height: '16px', accentColor: theme.colors.maroon }}
                        />
                        I am the Team Lead
                      </label>

                      {!form.is_team_lead ? (
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '0.8rem', color: '#555', marginBottom: '4px', display: 'block' }}>Enter Team Lead's USN/Name:</label>
                          <input
                            type="text"
                            style={styles.input}
                            value={form.team_lead_name}
                            onChange={(e) => setForm({ ...form, team_lead_name: e.target.value })}
                            placeholder="e.g. 4GM22CS001"
                            required
                          />
                        </div>
                      ) : (
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#555', marginBottom: '8px', display: 'block' }}>
                            Add Team Members (Max {selectedEvent.max_team_size - 1}):
                          </label>
                          {Array.from({ length: Math.min(form.team_members.length + 1, (selectedEvent.max_team_size || 2) - 1) }).map((_, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                              <input
                                type="text"
                                style={{ ...styles.input, flex: 1, padding: '0.5rem' }}
                                placeholder={`Member ${idx + 1} USN/Name`}
                                value={form.team_members[idx] || ''}
                                onChange={(e) => {
                                  const newMembers = [...form.team_members];
                                  newMembers[idx] = e.target.value;
                                  if (e.target.value === '') {
                                    newMembers.splice(idx, 1);
                                  }
                                  setForm({ ...form, team_members: newMembers });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={styles.formGroup}>
                  <label style={styles.label}>Semester *</label>
                  <select 
                    style={styles.input} 
                    value={form.semester} 
                    onChange={e => setForm({...form, semester: e.target.value})} 
                    required
                  >
                    <option value="">-- Select Semester --</option>
                    <option value="1st">1st Semester</option>
                    <option value="2nd">2nd Semester</option>
                    <option value="3rd">3rd Semester</option>
                    <option value="4th">4th Semester</option>
                    <option value="5th">5th Semester</option>
                    <option value="6th">6th Semester</option>
                    <option value="7th">7th Semester</option>
                    <option value="8th">8th Semester</option>
                  </select>
                </div>


                <div style={styles.formGroup}>
                  <label style={styles.label}>Special Requirements (Optional)</label>
                  <input 
                    style={styles.input} 
                    type="text" 
                    placeholder="e.g. Dietary needs, T-shirt size..."
                    value={form.special_requirements}
                    onChange={e => setForm({...form, special_requirements: e.target.value})}
                  />
                </div>

                <div style={styles.modalFooter}>
                  <button type="button" onClick={closeModal} style={styles.cancelBtn}>Cancel</button>
                  <button 
                    type="submit" 
                    style={s(styles.submitBtn, (registering || (selectedEvent?.details?.is_festival && form.selectedSubEvents.length === 0)) && { opacity: 0.7, cursor: "not-allowed" })}
                    disabled={registering || (selectedEvent?.details?.is_festival && form.selectedSubEvents.length === 0)}
                  >
                    {registering ? "Registering..." : `Confirm as ${form.reg_role.charAt(0).toUpperCase() + form.reg_role.slice(1)}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button style={styles.closeBtn} onClick={() => setFeedbackModalOpen(false)}>✕</button>
            <h2 style={styles.modalTitle}>Rate Your Experience</h2>
            <p style={styles.modalSub}>Your feedback helps us improve future events.</p>
            
            <form onSubmit={handleFeedbackSubmit} style={{ ...styles.formContainer, marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span 
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    style={{
                      fontSize: '2rem',
                      cursor: 'pointer',
                      color: star <= feedbackRating ? theme.colors.gold : '#DDD',
                      transition: 'color 0.2s'
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Additional Comments (Optional)</label>
                <textarea 
                  style={s(styles.input, { minHeight: "100px", resize: "vertical" })} 
                  placeholder="What did you like? What could be better?"
                  value={feedbackComments}
                  onChange={e => setFeedbackComments(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                style={s(styles.submitBtn, submittingFeedback && { opacity: 0.7 })} 
                disabled={submittingFeedback || feedbackRating === 0}
              >
                {submittingFeedback ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Certificate Generator Component */}
      <CertificateGenerator ref={certificateRef} />
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  centreState: { padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  stateText: { marginTop: "1rem", color: theme.colors.midGray, fontSize: "1rem", lineHeight: 1.5 },
  spinner: { width: "40px", height: "40px", border: "4px solid rgba(0,0,0,0.1)", borderTop: `4px solid ${theme.colors.maroon}`, borderRadius: "50%", animation: "spin 1s linear infinite" },
  
  // Toolbar
  toolbar: { display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.75rem" },
  searchWrap: {
    display: "flex", alignItems: "center", background: theme.colors.white,
    border: "1.5px solid #E8E2DB", borderRadius: theme.radii.lg, padding: "0 1rem",
    boxShadow: theme.shadows.sm, maxWidth: "480px",
  },
  searchIcon: { fontSize: "1rem", marginRight: "0.5rem", color: theme.colors.midGray },
  searchInput: { flex: 1, border: "none", outline: "none", padding: "0.65rem 0", fontSize: "0.9rem" },
  filterRow: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  filterBtn: {
    padding: "0.4rem 1rem", borderRadius: theme.radii.full, border: "1.5px solid #DDD",
    background: theme.colors.white, color: theme.colors.darkGray, fontSize: "0.82rem",
    cursor: "pointer", transition: theme.transitions.fast,
  },
  filterBtnActive: { background: theme.colors.maroon, borderColor: theme.colors.maroon, color: theme.colors.gold, fontWeight: "600" },
  resultCount: { fontSize: "0.82rem", color: theme.colors.midGray, marginBottom: "1rem" },
  
  // Grid
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" },
  
  // Card
  card: {
    background: theme.colors.white, borderRadius: theme.radii.xl,
    boxShadow: theme.shadows.md, border: "1px solid rgba(0,0,0,0.04)",
    display: "flex", flexDirection: "column", position: "relative",
    overflow: "hidden", transition: "transform 0.3s ease, box-shadow 0.3s ease",
  },
  cardHovered: { transform: "translateY(-4px)", boxShadow: theme.shadows.xl },
  cardAccent: { height: "5px", background: theme.gradients.primary, width: "100%" },
  cardBody: { padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" },
  categoryChip: {
    alignSelf: "flex-start", padding: "0.25rem 0.6rem", borderRadius: theme.radii.full,
    fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase",
    letterSpacing: "0.04em", marginBottom: "1rem",
  },
  cardTitle: { fontSize: "1.15rem", fontWeight: "700", color: theme.colors.charcoal, margin: "0 0 0.5rem" },
  cardDesc: { fontSize: "0.85rem", color: theme.colors.darkGray, lineHeight: 1.5, margin: "0 0 1.25rem" },
  metaRow: { display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "auto" },
  metaItem: { fontSize: "0.8rem", color: theme.colors.midGray },
  cardFooter: {
    padding: "1rem 1.5rem", borderTop: "1px solid #F0F0F0", background: "#FAFAFA",
    display: "flex", gap: "0.5rem",
  },
  brochureBtn: {
    flex: 1, padding: "0.6rem 0", borderRadius: theme.radii.md,
    border: "1px solid #CCC", background: "transparent", color: theme.colors.darkGray,
    fontSize: "0.85rem", fontWeight: "600", cursor: "pointer", transition: "0.2s",
  },
  registerBtn: {
    flex: 1, padding: "0.6rem 0", borderRadius: theme.radii.md,
    border: "none", background: theme.colors.maroon, color: theme.colors.white,
    fontSize: "0.85rem", fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(128,0,0,0.3)",
  },

  // Modal
  modalOverlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    padding: "1rem",
  },
  modalContent: {
    background: "#fff", borderRadius: "16px", padding: "2.5rem 2rem 2rem",
    width: "100%", maxWidth: "450px", position: "relative",
    maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },
  closeBtn: {
    position: "absolute", top: "16px", right: "20px",
    background: "none", border: "none", fontSize: "1.5rem", color: "#999", cursor: "pointer",
  },
  formContainer: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  modalTitle: { fontSize: "1.4rem", color: theme.colors.maroon, margin: 0, fontWeight: "bold" },
  modalSub: { fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem", marginTop: "-0.5rem" },
  formGroup: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  label: { fontSize: "0.85rem", fontWeight: "600", color: "#333" },
  input: {
    padding: "0.75rem", border: "1px solid #ddd", borderRadius: "8px",
    fontSize: "0.95rem", outline: "none", fontFamily: "inherit", background: "#fbfbfb"
  },
  modalFooter: {
    display: "flex",
    gap: "12px",
    marginTop: "8px",
  },
  cancelBtn: {
    flex: 1,
    padding: "12px",
    background: "#f5f5f5",
    color: "#555",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
  },
  submitBtn: {
    marginTop: "0.5rem", padding: "0.9rem", background: theme.colors.maroon, color: "#fff",
    border: "none", borderRadius: "8px", fontSize: "1rem", fontWeight: "600", cursor: "pointer",
    transition: "background 0.2s"
  },

  // Digital Ticket
  ticketContainer: {
    background: "#fff", borderRadius: "16px", overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #eef",
  },
  ticketHeader: {
    background: theme.colors.maroon, color: theme.colors.gold,
    padding: "1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center"
  },
  ticketBody: { padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.2rem" },
  ticketTitle: { fontSize: "1.3rem", fontWeight: "800", color: "#222", margin: 0, textAlign: "center", lineHeight: 1.3 },
  ticketMeta: { display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #ddd", paddingBottom: "1rem" },
  ticketLabel: { fontSize: "0.7rem", color: "#888", margin: "0 0 0.2rem", fontWeight: "700", letterSpacing: "0.05em" },
  ticketVal: { fontSize: "0.9rem", color: "#333", margin: 0, fontWeight: "600" },
  qrSection: { display: "flex", flexDirection: "column", alignItems: "center", marginTop: "1rem", padding: "1rem", background: "#f9f9f9", borderRadius: "12px" },
  qrCodeText: { fontSize: "0.8rem", color: "#666", marginTop: "0.75rem", fontFamily: "monospace", letterSpacing: "0.05em" },
  ticketFooter: { textAlign: "center", fontSize: "0.8rem", color: "#999", margin: 0, marginTop: "0.5rem", fontStyle: "italic" },

  // Tabs
  tabContainer: {
    display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid #E8E2DB", paddingBottom: "0.5rem"
  },
  tabBtn: {
    background: "transparent", border: "none", fontSize: "1rem", fontWeight: "600",
    color: theme.colors.midGray, cursor: "pointer", padding: "0.5rem 0.5rem",
    borderBottom: "3px solid transparent", transition: "all 0.2s"
  },
  tabBtnActive: {
    color: theme.colors.maroon, borderBottomColor: theme.colors.maroon
  },
  
  // Event Details View
  detailsContainer: {
    background: '#fff', padding: '2rem', borderRadius: '16px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)', marginBottom: '2rem',
    display: 'flex', flexDirection: 'column', gap: '1.5rem',
    borderTop: `6px solid ${theme.colors.gold}`
  },
  backBtn: {
    alignSelf: 'flex-start', background: 'none', border: 'none',
    color: '#555', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
    padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem',
    transition: 'color 0.2s'
  },
  detailsHeader: {
    display: 'flex', flexDirection: 'column', gap: '0.8rem',
    borderBottom: '1px solid #eee', paddingBottom: '1.5rem'
  },
  detailsTitle: {
    fontSize: '2.2rem', color: '#111', margin: 0, fontWeight: 800,
    lineHeight: 1.2
  },
  detailsOrg: {
    fontSize: '1rem', color: '#666', margin: 0
  },
  detailsBody: {
    display: 'flex', gap: '2rem', flexWrap: 'wrap'
  },
  detailsMain: {
    flex: '3 1 500px', display: 'flex', flexDirection: 'column', gap: '2rem'
  },
  detailsSidebar: {
    flex: '1 1 300px'
  },
  sectionTitle: {
    fontSize: '1.2rem', color: theme.colors.maroon, borderBottom: '2px solid #eee',
    paddingBottom: '0.5rem', marginBottom: '1rem', fontWeight: 700
  },
  detailsText: {
    whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#444', fontSize: '1rem', margin: 0
  },
  subEventCard: {
    padding: '1.2rem', background: '#fafafa', borderRadius: '12px',
    borderLeft: `4px solid ${theme.colors.maroon}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
  },
  subEventTitle: {
    margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#222'
  },
  subEventDesc: {
    margin: 0, fontSize: '0.95rem', color: '#555', lineHeight: 1.5
  },
  subEventMeta: {
    margin: '0.8rem 0 0 0', fontSize: '0.85rem', color: '#777',
    display: 'flex', gap: '1rem'
  },
  registerCard: {
    background: '#f8f9fa', borderRadius: '16px', padding: '1.5rem',
    border: '1px solid #e9ecef', position: 'sticky', top: '2rem'
  }
};
