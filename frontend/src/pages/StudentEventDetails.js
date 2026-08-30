import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Award, ChevronLeft } from 'lucide-react';
import { API_BASE } from '../config/api';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';

export default function StudentEventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({ reg_role: "participant", is_team_lead: true, team_lead_name: "", team_members: [], selectedSubEvents: [] });

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_published_events.php`, {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('jwt_token')}` }
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
      alert("Please select at least one sub-event.");
      return;
    }
    setRegistering(true);
    try {
      const payload = {
        event_id: event.id,
        role: form.reg_role,
        is_team_lead: form.is_team_lead,
        team_lead_name: form.team_lead_name,
        team_members: form.team_members.filter(m => m.trim() !== ""),
        sub_events: form.selectedSubEvents
      };
      const res = await fetch(`${API_BASE}/register_for_event.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        alert("Registration successful!");
        navigate('/student-dashboard');
      } else {
        alert("Registration failed: " + json.message);
      }
    } catch (err) {
      alert("An error occurred during registration.");
    } finally {
      setRegistering(false);
    }
  };

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
        <button onClick={() => navigate('/student-dashboard')} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', fontFamily: theme.fonts.sans }}>
      {/* Navbar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EAEAEA', padding: '1rem 2rem', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => navigate('/student-dashboard')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: theme.colors.charcoal, fontWeight: 600 }}>
          <ChevronLeft size={20} /> Back to Dashboard
        </button>
      </div>

      {/* Hero Banner */}
      <div style={{ 
        width: '100%', 
        height: '280px', 
        background: event.brochure_path ? `url(${API_BASE}/${event.brochure_path}) center/cover` : 'linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1))' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '2rem', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ display: 'inline-block', background: theme.colors.gold, color: theme.colors.maroon, padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>
            {event.category}
          </div>
          <h1 style={{ color: '#fff', fontSize: '2.5rem', margin: '0 0 10px 0', fontFamily: theme.fonts.serif }}>{event.event_title}</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '1.1rem' }}>Organized by GM University</p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* Left Column (Details) */}
        <div style={{ flex: '1 1 65%', minWidth: '300px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: theme.colors.maroon, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar /> About Event
            </h2>
            <p style={{ fontSize: '1rem', color: '#444', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {event.description}
            </p>
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', color: theme.colors.maroon, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin /> Logistics
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <strong style={{ display: 'block', color: '#888', fontSize: '0.85rem', textTransform: 'uppercase' }}>Event Date</strong>
                <span style={{ fontSize: '1.1rem', color: '#222', fontWeight: 600 }}>{event.event_date ? new Date(event.event_date).toLocaleDateString() : 'TBA'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#888', fontSize: '0.85rem', textTransform: 'uppercase' }}>Time</strong>
                <span style={{ fontSize: '1.1rem', color: '#222', fontWeight: 600 }}>{event.start_time || 'TBA'} - {event.end_time || 'TBA'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#888', fontSize: '0.85rem', textTransform: 'uppercase' }}>Venue</strong>
                <span style={{ fontSize: '1.1rem', color: '#222', fontWeight: 600 }}>{event.venue || 'TBA'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#888', fontSize: '0.85rem', textTransform: 'uppercase' }}>Coordinator</strong>
                <span style={{ fontSize: '1.1rem', color: '#222', fontWeight: 600 }}>{event.coordinator_name || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Registration Card) */}
        <div style={{ flex: '1 1 30%', minWidth: '300px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', position: 'sticky', top: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#2E7D32' }}>Free</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Registration Fee</div>
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid #EEE', margin: '1.5rem 0' }} />

            <form onSubmit={submitRegistration} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#333', marginBottom: '0.5rem' }}>Select Role</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['participant', 'volunteer'].map(r => {
                    const slotInfo = event.slots?.[r];
                    const isFull = slotInfo !== null && slotInfo !== undefined && slotInfo <= 0;
                    const isActive = form.reg_role === r;
                    return (
                      <button
                        key={r} type="button" disabled={isFull}
                        onClick={() => !isFull && setForm({ ...form, reg_role: r })}
                        style={{
                          flex: 1, padding: '0.75rem', borderRadius: '8px', cursor: isFull ? 'not-allowed' : 'pointer',
                          background: isActive ? theme.colors.maroon : isFull ? '#F5F5F5' : '#FFF',
                          color: isActive ? '#FFF' : isFull ? '#AAA' : '#333',
                          border: `2px solid ${isActive ? theme.colors.maroon : '#DDD'}`,
                          fontWeight: 600, textTransform: 'capitalize'
                        }}
                      >
                        {r}
                      </button>
                    )
                  })}
                </div>
              </div>

              {event.details?.is_festival && (event.details?.sub_events_logistics || event.details?.sub_events) && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#333', marginBottom: '0.5rem' }}>Select Sub-Events *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(event.details.sub_events_logistics || event.details.sub_events).map((sub, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#F8F9FA', borderRadius: '8px', border: '1px solid #E0E0E0', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={form.selectedSubEvents.includes(sub.name)}
                          onChange={(e) => {
                            if (e.target.checked) setForm({ ...form, selectedSubEvents: [...form.selectedSubEvents, sub.name] });
                            else setForm({ ...form, selectedSubEvents: form.selectedSubEvents.filter(s => s !== sub.name) });
                          }}
                          style={{ width: '16px', height: '16px', accentColor: theme.colors.maroon }}
                        />
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{sub.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {event.participation_type === 'group' && form.reg_role === 'participant' && (
                <div style={{ background: '#F8F9FA', padding: '1rem', borderRadius: '8px', border: '1px solid #E0E0E0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_team_lead} onChange={(e) => setForm({ ...form, is_team_lead: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: theme.colors.maroon }} />
                    I am the Team Lead
                  </label>

                  {!form.is_team_lead ? (
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#555', marginBottom: '4px', display: 'block' }}>Enter Team Lead's USN/Name:</label>
                      <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #DDD', boxSizing: 'border-box' }} value={form.team_lead_name} onChange={(e) => setForm({ ...form, team_lead_name: e.target.value })} required />
                    </div>
                  ) : (
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#555', marginBottom: '8px', display: 'block' }}>Add Team Members (Max {event.max_team_size - 1}):</label>
                      {Array.from({ length: Math.min(form.team_members.length + 1, (event.max_team_size || 2) - 1) }).map((_, idx) => (
                        <input key={idx} type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #DDD', boxSizing: 'border-box', marginBottom: '8px' }} placeholder={`Member ${idx + 1} USN/Name`} value={form.team_members[idx] || ''} onChange={(e) => {
                          const newMembers = [...form.team_members];
                          newMembers[idx] = e.target.value;
                          if (e.target.value === '') newMembers.splice(idx, 1);
                          setForm({ ...form, team_members: newMembers });
                        }} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button 
                type="submit" 
                disabled={registering}
                style={{
                  width: '100%', padding: '1rem', borderRadius: '8px', background: theme.colors.maroon, color: theme.colors.gold,
                  fontSize: '1.1rem', fontWeight: 'bold', border: 'none', cursor: registering ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(128,0,0,0.3)', transition: 'background 0.2s',
                  opacity: registering ? 0.7 : 1
                }}
              >
                {registering ? 'Registering...' : 'Register Now'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#888' }}>
              <Users size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Registration closes on {event.registration_date ? new Date(event.registration_date).toLocaleDateString() : 'TBA'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
