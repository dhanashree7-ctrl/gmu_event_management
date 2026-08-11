import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import theme from '../theme';
import QRScanner from './QRScanner';

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('gmu_user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.role !== 'volunteer') {
        navigate('/login');
      }
    } catch (e) {
      navigate('/login');
    }
  }, [navigate]);

  if (!user) return null;

  return (
    <div style={styles.root}>
      {/* Top Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.crest}>⚜</span>
          <div>
            <div style={styles.title}>Volunteer Portal</div>
            <div style={styles.subTitle}>GM University Event System</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userInfo}>👤 {user.name}</span>
          <button 
            style={styles.logoutBtn} 
            onClick={() => {
              sessionStorage.removeItem('gmu_user');
              navigate('/login');
            }}
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Main Content Area: Renders the QR Scanner */}
      <main style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Event Check-In Scanner</h2>
          <p style={styles.cardDesc}>
            Scan attendee QR codes to mark them as present for the event. Ensure you have the correct camera selected.
          </p>
          <div style={styles.scannerWrapper}>
             <QRScanner isEmbedded={true} />
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    backgroundColor: theme.colors.offWhite,
    fontFamily: theme.fonts.sansSerif,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: theme.colors.maroon,
    color: '#fff',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: theme.shadows.md,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  crest: {
    fontSize: '2rem',
    color: theme.colors.gold,
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: theme.fontWeights.bold,
  },
  subTitle: {
    fontSize: '0.8rem',
    color: theme.colors.goldLight,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  userInfo: {
    fontSize: '0.9rem',
    fontWeight: theme.fontWeights.medium,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: theme.radii.md,
    cursor: 'pointer',
    fontWeight: theme.fontWeights.bold,
    transition: 'all 0.2s',
  },
  main: {
    flex: 1,
    padding: '2rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: theme.radii.lg,
    boxShadow: theme.shadows.lg,
    padding: '2rem',
    width: '100%',
    maxWidth: '900px',
  },
  cardTitle: {
    margin: '0 0 0.5rem 0',
    color: theme.colors.maroon,
    fontSize: '1.5rem',
  },
  cardDesc: {
    margin: '0 0 1.5rem 0',
    color: theme.colors.midGray,
    fontSize: '0.95rem',
  },
  scannerWrapper: {
    border: `2px dashed ${theme.colors.lightGray}`,
    borderRadius: theme.radii.md,
    padding: '1rem',
    backgroundColor: '#FAFAFA',
  }
};
