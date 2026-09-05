import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Phone, Award, ChevronLeft, Tag, AlertCircle } from 'lucide-react';
import { API_BASE } from '../config/api';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return 'TBA';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(t) {
  if (!t) return 'TBA';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  return `${((hour % 12) || 12)}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date(new Date().toDateString());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StudentEventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({
    reg_role: 'participant',
    is_team_lead: true,
    team_lead_name: '',
    team_members: [],
    selectedSubEvents: [],
  });

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_published_events.php`, {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('jwt_token')}` },
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const found = json.data.find(e => String(e.id) === String(eventId));
          setEvent(found);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [eventId]);

  const submitRegistration = async (e) => {
    e.preventDefault();
    if (!event) return;
    if (event.details?.is_festival && form.selectedSubEvents.length === 0) {
      alert('Please select at least one sub-event.');
      return;
    }
    setRegistering(true);
    try {
      const payload = {
        event_id: event.id,
        role: form.reg_role,
        is_team_lead: form.is_team_lead,
        team_lead_name: form.team_lead_name,
        team_members: form.team_members.filter(m => m.trim() !== ''),
        sub_events: form.selectedSubEvents,
      };
      const res = await fetch(`${API_BASE}/register_for_event.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('jwt_token')}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        alert('Registration successful!');
        navigate('/student-dashboard');
      } else {
        alert('Registration failed: ' + json.message);
      }
    } catch (err) {
      alert('An error occurred during registration.');
    } finally {
      setRegistering(false);
    }
  };

  // ── Loading / Not Found ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8F9FA' }}>
        <div style={{ width: 40, height: 40, border: `4px solid ${theme.colors.maroon}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }
  if (!event) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>Event not found</h2>
        <button onClick={() => navigate('/student-dashboard')} style={{ padding: '0.5rem 1rem', marginTop: '1rem', background: theme.colors.maroon, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Go Back
        </button>
      </div>
    );
  }

  const subEvents = event.details?.sub_events_logistics || event.details?.sub_events || [];
  const isFestival = !!event.details?.is_festival;
  const isGroupSubEventSelected = subEvents.some(s => form.selectedSubEvents.includes(s.name) && s.participation_type === 'group');
  // For festivals: only show group form when a group sub-event is selected
  // For standalone events: check participation_type or max_team_size
  const isGroupEvent = isFestival
    ? isGroupSubEventSelected
    : (event.participation_type === 'group' || (event.max_team_size && event.max_team_size > 1));
  let activeMaxTeamSize = event.max_team_size || 2;
  if (isFestival && isGroupSubEventSelected) {
    const groupSub = subEvents.find(s => form.selectedSubEvents.includes(s.name) && s.participation_type === 'group');
    if (groupSub && groupSub.max_team_size) activeMaxTeamSize = Number(groupSub.max_team_size);
  }
  const regDaysLeft = daysUntil(event.registration_deadline);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#F2EDE8', fontFamily: theme.fonts.sans, overflowX: 'hidden' }}>
      {/* ── Navbar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EAEAEA', padding: '0.85rem 2rem', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <button
          onClick={() => navigate('/student-dashboard')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: theme.colors.maroon, fontWeight: 600 }}
        >
          <ChevronLeft size={20} /> Back to Dashboard
        </button>
      </div>

      {/* ── Hero Banner ── */}
      <div style={{
        width: '100%',
        height: '260px',
        background: event.brochure_file_path
          ? `url(${API_BASE}/${event.brochure_file_path}) center/cover`
          : `linear-gradient(135deg, ${theme.colors.maroon} 0%, #701a1e 60%, #8B2225 100%)`,
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.2))' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '2rem 2.5rem', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span style={{ background: theme.colors.gold, color: theme.colors.maroon, padding: '4px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {event.category}
            </span>
            {isGroupEvent && (
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={12} /> Group Event
              </span>
            )}
            {isFestival && (
              <span style={{ background: 'rgba(253,208,111,0.25)', color: theme.colors.gold, border: '1px solid rgba(253,208,111,0.5)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 }}>
                🎪 Mega Festival
              </span>
            )}
          </div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.5rem, 4vw, 2.4rem)', margin: '0 0 6px 0', fontFamily: theme.fonts.serif, lineHeight: 1.2 }}>
            {event.event_title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '0.95rem' }}>
            Organized by GM University • {event.event_scale === 'university' ? 'University-Wide' : event.event_scale === 'department' ? `${event.proposer_dept} Dept.` : 'Campus'} Event
          </p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ padding: '1.25rem 1.5rem 3rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>

        {/* ── Left Column ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* About */}
          <div style={card}>
            <SectionTitle icon={<Calendar size={18} />} title="About This Event" />
            <p style={{ fontSize: '1rem', color: '#444', lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0 }}>
              {event.description}
            </p>
          </div>

          {/* Logistics */}
          <div style={card}>
            <SectionTitle icon={<MapPin size={18} />} title="Event Logistics" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <LogisticItem label="Event Date" value={formatDate(event.event_date)} />
              <LogisticItem label="Time" value={
                event.event_time
                  ? formatTime(event.event_time)
                  : (event.start_time ? formatTime(event.start_time) : 'TBA')
              } />
              <LogisticItem label="Venue" value={event.venue || 'TBA'} />
              <LogisticItem label="Mode" value={event.event_mode === 'online' ? '🌐 Online' : '📍 Offline'} />
              <LogisticItem label="Coordinator" value={event.coordinator_name || 'N/A'} />
              <LogisticItem label="Coordinator Phone" value={event.coordinator_number || 'N/A'} />
              {(event.max_team_size && event.max_team_size > 1) && (
                <LogisticItem label="Max Team Size" value={`${event.max_team_size} members`} />
              )}
            </div>

            {/* Registration Deadline — Prominent */}
            {event.registration_deadline && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem 1.25rem',
                borderRadius: '10px',
                background: regDaysLeft !== null && regDaysLeft <= 3 ? '#FFF5F5' : '#FFFBF0',
                border: `1.5px solid ${regDaysLeft !== null && regDaysLeft <= 3 ? '#FFCDD2' : theme.colors.gold}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <AlertCircle size={20} color={regDaysLeft !== null && regDaysLeft <= 3 ? '#C62828' : '#C17F24'} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Registration Deadline
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: regDaysLeft !== null && regDaysLeft <= 3 ? '#C62828' : theme.colors.maroon }}>
                    {formatDate(event.registration_deadline)}
                    {regDaysLeft !== null && (
                      <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: regDaysLeft <= 3 ? '#C62828' : '#666' }}>
                        {regDaysLeft === 0 ? '— Closes Today!' : regDaysLeft < 0 ? '— Closed' : `— ${regDaysLeft} day${regDaysLeft === 1 ? '' : 's'} left`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sub-Events (if festival) */}
          {isFestival && subEvents.length > 0 && (
            <div style={card}>
              <SectionTitle icon={<Tag size={18} />} title={`Sub-Events (${subEvents.length})`} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {subEvents.map((sub, i) => (
                  <div key={i} style={{ padding: '1rem 1.25rem', background: '#FDFBF8', borderRadius: '10px', border: '1px solid #EEE9E2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '1rem', color: theme.colors.maroon }}>{sub.name}</strong>
                      {sub.participation_type && (
                        <span style={{ background: '#EDE7F6', color: '#512DA8', fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', textTransform: 'capitalize' }}>
                          {sub.participation_type}
                        </span>
                      )}
                    </div>
                    {sub.description && (
                      <p style={{ fontSize: '0.88rem', color: '#666', margin: '0 0 0.75rem', lineHeight: 1.6 }}>{sub.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      {(sub.coordinator_name) && (
                        <span style={{ fontSize: '0.82rem', color: '#555', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={13} /> {sub.coordinator_name}
                        </span>
                      )}
                      {(sub.coordinator_phone) && (
                        <span style={{ fontSize: '0.82rem', color: '#555', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={13} /> {sub.coordinator_phone}
                        </span>
                      )}
                      {sub.max_participants && (
                        <span style={{ fontSize: '0.82rem', color: '#555', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Award size={13} /> Max {sub.max_participants} participants
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column — Registration Card ── */}
        <div style={{ width: '320px', flexShrink: 0 }}>
          <div style={{ ...card, position: 'sticky', top: '5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#2E7D32' }}>Free</div>
              <div style={{ fontSize: '0.9rem', color: '#888' }}>Registration Fee</div>
            </div>

            {/* Capacity info */}
            {event.slots_remaining?.participant !== null && event.slots_remaining?.participant !== undefined && (
              <div style={{ textAlign: 'center', marginBottom: '1rem', padding: '0.5rem', background: event.slots_remaining.participant <= 10 ? '#FFF5F5' : '#F0FFF4', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, color: event.slots_remaining.participant <= 10 ? '#C62828' : '#2E7D32' }}>
                {event.slots_remaining.participant <= 0 ? '❌ Fully Booked' : `${event.slots_remaining.participant} seats remaining`}
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid #EEE', margin: '1rem 0' }} />

            {event.is_registered ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', background: '#F0FFF4', borderRadius: '10px', border: '1px solid #C8E6C9' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <div style={{ fontWeight: 700, color: '#2E7D32', fontSize: '1rem' }}>You are registered!</div>
                <div style={{ fontSize: '0.82rem', color: '#666', marginTop: '0.25rem' }}>Check My Events for your QR code.</div>
              </div>
            ) : (
              <form onSubmit={submitRegistration} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Role selection */}
                <div>
                  <label style={fieldLabel}>Select Role</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['participant', 'volunteer'].map(r => {
                      const slotInfo = event.slots_remaining?.[r];
                      const isFull = slotInfo !== null && slotInfo !== undefined && slotInfo <= 0;
                      const isActive = form.reg_role === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          disabled={isFull}
                          onClick={() => !isFull && setForm({ ...form, reg_role: r })}
                          style={{
                            flex: 1, padding: '0.75rem', borderRadius: '8px',
                            cursor: isFull ? 'not-allowed' : 'pointer',
                            background: isActive ? theme.colors.maroon : isFull ? '#F5F5F5' : '#FFF',
                            color: isActive ? theme.colors.gold : isFull ? '#AAA' : '#333',
                            border: `2px solid ${isActive ? theme.colors.maroon : isFull ? '#DDD' : '#DDD'}`,
                            fontWeight: 600, textTransform: 'capitalize',
                            transition: 'all 0.2s',
                          }}
                        >
                          {r}
                          {isFull && <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 400 }}>Full</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-event selection for festivals */}
                {isFestival && subEvents.length > 0 && (
                  <div>
                    <label style={fieldLabel}>Select Sub-Events *</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {subEvents.map((sub, i) => (
                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: '#F8F9FA', borderRadius: '8px', border: `1px solid ${form.selectedSubEvents.includes(sub.name) ? theme.colors.maroon : '#E0E0E0'}`, cursor: 'pointer', transition: 'border-color 0.2s' }}>
                          <input
                            type="checkbox"
                            checked={form.selectedSubEvents.includes(sub.name)}
                            onChange={(e) => {
                              if (e.target.checked) setForm({ ...form, selectedSubEvents: [...form.selectedSubEvents, sub.name] });
                              else setForm({ ...form, selectedSubEvents: form.selectedSubEvents.filter(s => s !== sub.name) });
                            }}
                            style={{ width: '15px', height: '15px', accentColor: theme.colors.maroon }}
                          />
                          <span style={{ fontSize: '0.88rem', fontWeight: 500, color: '#333' }}>{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Group event fields */}
                {isGroupEvent && form.reg_role === 'participant' && (
                  <div style={{ background: '#FDFBF8', padding: '1rem', borderRadius: '10px', border: '1px solid #EEE9E2' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: theme.colors.maroon, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} /> Group Registration
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.75rem', cursor: 'pointer', color: '#333' }}>
                      <input
                        type="checkbox"
                        checked={form.is_team_lead}
                        onChange={(e) => setForm({ ...form, is_team_lead: e.target.checked, team_lead_name: '', team_members: [] })}
                        style={{ width: '15px', height: '15px', accentColor: theme.colors.maroon }}
                      />
                      I am the Team Lead
                    </label>
                    {!form.is_team_lead ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>Team Name</label>
                          <input
                            type="text"
                            style={textInput}
                            value={form.team_name}
                            onChange={(e) => setForm({ ...form, team_name: e.target.value })}
                            required
                            placeholder="e.g. Code Ninjas"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>Team Lead's Name / USN</label>
                          <input
                            type="text"
                            style={textInput}
                            value={form.team_lead_name}
                            onChange={(e) => setForm({ ...form, team_lead_name: e.target.value })}
                            required
                            placeholder="Enter team lead's USN or name"
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>Team Name</label>
                          <input
                            type="text"
                            style={{ ...textInput, marginBottom: '2px' }}
                            value={form.team_name}
                            onChange={(e) => setForm({ ...form, team_name: e.target.value })}
                            required
                            placeholder="e.g. Code Ninjas"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>
                            Add Team Members <span style={{ color: '#888' }}>(Max {activeMaxTeamSize - 1})</span>
                          </label>
                          {Array.from({ length: Math.min(form.team_members.length + 1, activeMaxTeamSize - 1) }).map((_, idx) => (
                            <input
                              key={idx}
                              type="text"
                              style={{ ...textInput, marginBottom: '6px' }}
                              placeholder={`Member ${idx + 1} USN / Name`}
                              value={form.team_members[idx] || ''}
                              onChange={(e) => {
                                const newMembers = [...form.team_members];
                                newMembers[idx] = e.target.value;
                                if (e.target.value === '') newMembers.splice(idx, 1);
                                setForm({ ...form, team_members: newMembers });
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={registering || (event.slots_remaining?.participant <= 0)}
                  style={{
                    width: '100%', padding: '1rem', borderRadius: '10px',
                    background: theme.colors.maroon, color: theme.colors.gold,
                    fontSize: '1rem', fontWeight: 'bold', border: 'none',
                    cursor: registering ? 'wait' : 'pointer',
                    boxShadow: '0 4px 14px rgba(74,4,4,0.3)',
                    transition: 'opacity 0.2s',
                    opacity: registering ? 0.7 : 1,
                  }}
                >
                  {registering ? 'Registering…' : '📝 Register Now'}
                </button>
              </form>
            )}

            {event.registration_deadline && (
              <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.82rem', color: '#888' }}>
                <Clock size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Deadline: {formatDate(event.registration_deadline)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionTitle({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
      <span style={{ color: theme.colors.maroon }}>{icon}</span>
      <h2 style={{ fontSize: '1.2rem', color: theme.colors.maroon, margin: 0, fontWeight: 700 }}>{title}</h2>
    </div>
  );
}

function LogisticItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '1rem', color: '#222', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

// ── Inline styles ─────────────────────────────────────────────────────────────
const card = {
  background: '#FBF8F5',
  borderRadius: '14px',
  padding: '1.25rem 1.5rem',
  boxShadow: 'none',
  border: '1px solid #DDD5CA',
};

const fieldLabel = {
  display: 'block',
  fontSize: '0.88rem',
  fontWeight: 600,
  color: '#444',
  marginBottom: '0.5rem',
};

const textInput = {
  width: '100%',
  padding: '0.7rem 0.85rem',
  borderRadius: '8px',
  border: '1px solid #DDD',
  boxSizing: 'border-box',
  fontSize: '0.9rem',
  outline: 'none',
  fontFamily: 'inherit',
};
