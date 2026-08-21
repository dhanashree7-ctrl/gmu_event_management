import React, { useState, useMemo } from 'react';
import theme from '../theme';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function EventCalendar({ events }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Map events to their days
  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      if (ev.event_date || ev.submitted_at) {
        // Try to parse event_date first, fallback to submitted_at for rendering if date not finalized
        const dStr = ev.event_date ? ev.event_date : ev.submitted_at;
        const d = new Date(dStr);
        if (!isNaN(d.valueOf()) && d.getFullYear() === year && d.getMonth() === month) {
          const day = d.getDate();
          if (!map[day]) map[day] = [];
          map[day].push(ev);
        }
      }
    });
    return map;
  }, [events, year, month]);

  const renderCells = () => {
    const cells = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} style={styles.emptyCell}></div>);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dayEvents = eventsByDay[d] || [];
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
      
      cells.push(
        <div key={d} style={s(styles.cell, isToday && styles.todayCell)}>
          <div style={styles.dayNumber}>{d}</div>
          <div style={styles.eventContainer}>
            {dayEvents.map((ev, idx) => (
              <div 
                key={idx} 
                style={s(styles.eventBadge, { 
                  backgroundColor: (ev.status || ev.current_status)?.toLowerCase() === 'published' ? theme.colors.success : theme.colors.maroon 
                })}
                title={ev.event_title}
              >
                {ev.event_title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return cells;
  };

  return (
    <div style={styles.calendarWrapper}>
      <div style={styles.header}>
        <button onClick={handlePrevMonth} style={styles.navBtn}>◀</button>
        <h2 style={styles.monthLabel}>
          {currentDate.toLocaleString('default', { month: 'long' })} {year}
        </h2>
        <button onClick={handleNextMonth} style={styles.navBtn}></button>
      </div>
      
      <div style={styles.grid}>
        {daysOfWeek.map(day => (
          <div key={day} style={styles.dayHeader}>{day}</div>
        ))}
        {renderCells()}
      </div>
    </div>
  );
}

const s = (...styles) => Object.assign({}, ...styles.filter(Boolean));

const styles = {
  calendarWrapper: {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    border: '1px solid #eee',
    display: 'flex',
    flexDirection: 'column',
    height: '100%', // Clamped to parent
    flex: 1,
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexShrink: 0
  },
  navBtn: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0.4rem 1rem',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background 0.2s, transform 0.1s',
    color: '#334155'
  },
  monthLabel: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '800',
    color: theme.colors.maroon
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gridTemplateRows: 'auto repeat(6, 1fr)', // 1 row for days, 6 for weeks
    gap: '6px',
    flex: 1,
    minHeight: 0, // Critical for grid to compress
  },
  dayHeader: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#64748b',
    padding: '0.25rem 0',
    fontSize: '0.85rem'
  },
  emptyCell: {
    background: '#f8fafc',
    borderRadius: '8px',
    border: '1px dashed #e2e8f0'
  },
  cell: {
    background: '#fff',
    border: '1px solid #f1f5f9',
    borderRadius: '8px',
    padding: '0.4rem',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden', // Stop cells from breaking grid row height
    transition: 'border-color 0.2s',
  },
  todayCell: {
    background: '#fffbf0',
    borderColor: theme.colors.gold,
    boxShadow: 'inset 0 0 0 1px #FDD06F'
  },
  dayNumber: {
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '0.1rem',
    fontSize: '0.85rem'
  },
  eventContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    overflowY: 'auto',
    flex: 1, // fill remaining cell space
    minHeight: 0,
    paddingRight: '2px'
  },
  eventBadge: {
    color: '#fff',
    fontSize: '0.65rem',
    padding: '2px 5px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
    fontWeight: '600'
  }
};
