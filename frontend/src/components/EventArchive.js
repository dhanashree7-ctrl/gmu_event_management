import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE } from '../config/api';
import theme from '../theme';
import { X, ChevronLeft, ChevronRight, Image, FileText, Download, Star } from 'lucide-react';

const s = (...styles) => Object.assign({}, ...styles.filter(Boolean));

// ── inject keyframes once ────────────────────────────────────────────────────
if (!document.getElementById('archive-styles')) {
  const style = document.createElement('style');
  style.id = 'archive-styles';
  style.textContent = `
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes scaleIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
    .archive-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
    .archive-card:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(0,0,0,0.12) !important; }
    .gallery-thumb { transition: transform 0.2s ease, opacity 0.2s ease; }
    .gallery-thumb:hover { transform: scale(1.05); opacity: 0.85; }
    .archive-btn { transition: all 0.2s ease; }
    .archive-btn:hover { transform: translateY(-1px); }
    .year-filter-btn { transition: all 0.2s ease; }
    .year-filter-btn:hover { opacity: 0.85; }
  `;
  document.head.appendChild(style);
}

// ── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ images, initialIndex, apiBase, onClose }) {
  const [idx, setIdx] = useState(initialIndex);

  const prev = useCallback((e) => {
    e.stopPropagation();
    setIdx(i => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback((e) => {
    e.stopPropagation();
    setIdx(i => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [images.length, onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.93)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '1.25rem', right: '1.5rem',
          background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
          width: '42px', height: '42px', color: '#fff', fontSize: '1.4rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1,
        }}
      >
        <X size={20} />
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={prev}
          style={{
            position: 'absolute', left: '1.5rem',
            background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
            width: '48px', height: '48px', color: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Image */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.25s ease', maxWidth: '90vw', maxHeight: '85vh' }}
      >
        <img
          src={`${apiBase}/${images[idx]}`}
          alt={`Gallery ${idx + 1}`}
          style={{
            maxWidth: '90vw', maxHeight: '85vh',
            objectFit: 'contain', borderRadius: '8px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          }}
        />
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', marginTop: '0.75rem', fontSize: '0.85rem' }}>
          {idx + 1} / {images.length}
        </p>
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={next}
          style={{
            position: 'absolute', right: '1.5rem',
            background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
            width: '48px', height: '48px', color: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
}

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ value }) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={13}
          fill={i <= full ? '#F59E0B' : (i === full + 1 && hasHalf ? 'none' : 'none')}
          color={i <= full || (i === full + 1 && hasHalf) ? '#F59E0B' : '#D1D5DB'}
          strokeWidth={1.5}
        />
      ))}
      <span style={{ fontSize: '0.75rem', color: '#555', marginLeft: '4px', fontWeight: 600 }}>
        {value > 0 ? value : 'N/A'}
      </span>
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EventArchive({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState('All');

  // Report modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const fetchArchive = async () => {
      setLoading(true);
      try {
        const url = `${API_BASE}/get_archived_events.php?role=${user?.role}&department=${encodeURIComponent(user?.department_name || '')}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) {
          setEvents(json.data);
        } else {
          setError(json.message);
        }
      } catch (err) {
        setError('Failed to connect to server.');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchArchive();
  }, [user]);

  const academicYears = useMemo(() => {
    const years = new Set(events.map(ev => ev.academic_year));
    return ['All', ...Array.from(years)].sort((a, b) => b.localeCompare(a));
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (selectedYear === 'All') return events;
    return events.filter(ev => ev.academic_year === selectedYear);
  }, [events, selectedYear]);

  const openLightbox = (images, idx) => {
    setLightboxImages(images);
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const handleReadReport = (ev) => {
    setSelectedReport(ev);
    setReportModalOpen(true);
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: theme.colors.midGray }}>
      <div style={{ width: '36px', height: '36px', border: `3px solid #eee`, borderTopColor: theme.colors.maroon, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
      Loading historical records...
    </div>
  );
  if (error) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#d32f2f' }}>Error: {error}</div>
  );

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.8rem', color: theme.colors.maroon, fontFamily: theme.fonts.serif, fontWeight: 800 }}>
          Event Archive
        </h2>
        <p style={{ margin: '6px 0 0', color: theme.colors.midGray, fontSize: '0.95rem' }}>
          Historical record of all successfully completed events, including galleries and reports.
        </p>
      </div>

      {/* ── Year Filter ── */}
      {academicYears.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.75rem' }}>
          <span style={{ fontWeight: 600, color: '#555', fontSize: '0.9rem' }}>Academic Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '8px',
              border: '1px solid #CCC',
              background: '#fff',
              color: '#333',
              fontSize: '0.9rem',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          >
            {academicYears.map(year => (
              <option key={year} value={year}>
                {year === 'All' ? 'All Years' : year}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Grid ── */}
      {filteredEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#FAFAFA', borderRadius: '16px', border: '1px dashed #CCC' }}>
          <Image size={48} color="#CCC" style={{ marginBottom: '1rem' }} />
          <p style={{ color: '#888', fontSize: '1rem' }}>No archived events found for this selection.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredEvents.map(ev => {
            const hasGallery = Array.isArray(ev.gallery_images) && ev.gallery_images.length > 0;
            const hasReport = ev.post_event_report || ev.report_file_path;
            return (
              <div key={ev.id} className="archive-card" style={styles.card}>
                {/* Gallery strip */}
                {hasGallery ? (
                  <div style={{ position: 'relative', height: '180px', overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
                    {/* Main hero */}
                    <img
                      src={`${API_BASE}/${ev.gallery_images[0]}`}
                      alt="Event"
                      onClick={() => openLightbox(ev.gallery_images, 0)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block' }}
                    />
                    {/* Thumbnail strip overlay */}
                    {ev.gallery_images.length > 1 && (
                      <div style={{
                        position: 'absolute', bottom: '8px', left: '8px',
                        display: 'flex', gap: '5px',
                      }}>
                        {ev.gallery_images.slice(1, 4).map((img, i) => (
                          <img
                            key={i}
                            src={`${API_BASE}/${img}`}
                            alt={`thumb-${i}`}
                            className="gallery-thumb"
                            onClick={() => openLightbox(ev.gallery_images, i + 1)}
                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #fff', cursor: 'pointer' }}
                          />
                        ))}
                        {ev.gallery_images.length > 4 && (
                          <div
                            onClick={() => openLightbox(ev.gallery_images, 4)}
                            style={{
                              width: '48px', height: '48px', borderRadius: '6px', background: 'rgba(0,0,0,0.55)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', border: '2px solid #fff',
                            }}
                          >
                            +{ev.gallery_images.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Photo count badge */}
                    <div style={{
                      position: 'absolute', top: '10px', right: '10px',
                      background: 'rgba(0,0,0,0.6)', color: '#fff',
                      fontSize: '0.7rem', fontWeight: 600, borderRadius: '999px', padding: '3px 9px',
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <Image size={11} /> {ev.gallery_images.length} Photos
                    </div>
                  </div>
                ) : (
                  <div style={{
                    height: '120px', background: 'linear-gradient(135deg, #1a0000 0%, #4a0000 100%)',
                    borderRadius: '12px 12px 0 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem',
                  }}>
                    <Image size={36} color="rgba(255,255,255,0.3)" />
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>No photos uploaded</span>
                  </div>
                )}

                {/* Card body */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={styles.categoryChip}>{ev.category}</span>
                    <span style={styles.yearBadge}>{ev.academic_year}</span>
                  </div>
                  <h3 style={styles.cardTitle}>{ev.event_title}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', color: '#666', marginBottom: '1rem' }}>
                    <span><strong>Date:</strong> {new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span><strong>Organizer:</strong> {ev.proposed_by}</span>
                    <span><strong>Participants:</strong> {ev.total_participants || 0}</span>
                  </div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <StarRating value={ev.average_rating} />
                  </div>

                  {/* Footer buttons */}
                  <div style={{ marginTop: 'auto', display: 'flex', gap: '0.6rem' }}>
                    {hasGallery && (
                      <button
                        className="archive-btn"
                        onClick={() => openLightbox(ev.gallery_images, 0)}
                        style={s(styles.btn, { background: '#1a237e', flex: 1 })}
                        onMouseOver={e => e.currentTarget.style.background = '#283593'}
                        onMouseOut={e => e.currentTarget.style.background = '#1a237e'}
                      >
                        <Image size={14} /> Gallery
                      </button>
                    )}
                    {hasReport && (
                      <button
                        className="archive-btn"
                        onClick={() => handleReadReport(ev)}
                        style={s(styles.btn, { flex: 1 })}
                        onMouseOver={e => e.currentTarget.style.background = '#B71C1C'}
                        onMouseOut={e => e.currentTarget.style.background = theme.colors.maroon}
                      >
                        <FileText size={14} /> Report
                      </button>
                    )}
                    {!hasGallery && !hasReport && (
                      <span style={{ fontSize: '0.8rem', color: '#999', fontStyle: 'italic' }}>No media available yet</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Report Modal ── */}
      {reportModalOpen && selectedReport && (
        <div style={styles.modalOverlay} onClick={() => setReportModalOpen(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>Post-Event Report</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)' }}>
                  {selectedReport.event_title}
                </p>
              </div>
              <button style={styles.closeBtn} onClick={() => setReportModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={styles.modalBody}>
              {selectedReport.post_event_report && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', color: theme.colors.maroon }}>Written Summary</h4>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#333', background: '#F9F9F9', padding: '1rem', borderRadius: '8px', border: '1px solid #EEE', margin: 0 }}>
                    {selectedReport.post_event_report}
                  </p>
                </div>
              )}
              {selectedReport.report_file_path && (
                <a
                  href={`${API_BASE}/${selectedReport.report_file_path}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '0.6rem 1.25rem',
                    background: '#1565C0', color: '#fff',
                    textDecoration: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem',
                  }}
                >
                  <Download size={16} /> Download PDF Report
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <Lightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          apiBase={API_BASE}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}

const styles = {
  card: {
    background: '#fff', borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
    border: '1px solid #EDE9E3',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  categoryChip: {
    background: '#FFF8E1', color: '#7a4a00',
    padding: '3px 8px', borderRadius: '999px',
    fontSize: '0.72rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  yearBadge: {
    background: '#EDE7F6', color: '#512DA8',
    padding: '3px 8px', borderRadius: '4px',
    fontSize: '0.72rem', fontWeight: 700,
  },
  cardTitle: {
    margin: '0 0 0.75rem', fontSize: '1.05rem',
    color: theme.colors.charcoal, lineHeight: 1.3, fontWeight: 700,
  },
  btn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '0.55rem 0.75rem',
    background: theme.colors.maroon, color: '#fff',
    border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
  },
  modalOverlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(10,5,5,0.55)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem', animation: 'fadeIn 0.2s ease',
  },
  modalContent: {
    background: '#fff', borderRadius: '14px',
    width: '100%', maxWidth: '620px', maxHeight: '90vh',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 24px 60px rgba(74,4,4,0.22)',
    overflow: 'hidden', animation: 'slideUp 0.22s ease',
  },
  modalHeader: {
    background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
    padding: '1.4rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
    width: '34px', height: '34px', color: '#fff',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s',
  },
  modalBody: {
    padding: '1.5rem', overflowY: 'auto',
  },
};
