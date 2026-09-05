import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';
import theme from '../theme';

const s = (...styles) => Object.assign({}, ...styles);

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side basic validation
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const json = await res.json();

      if (json.success) {
        // If a faculty member is the Head of SA, treat them as student_affairs in the frontend
        if (json.data.role?.toLowerCase() === 'faculty' && json.data.department_name === 'Student Affairs') {
            json.data.role = 'student_affairs';
        }

        if (json.token) {
          sessionStorage.setItem('jwt_token', json.token);
        }
        login(json.data);

        const role = json.data.role?.toLowerCase();

        if (role === 'hod') {
          navigate('/hod-dashboard', { replace: true });
        } else if (role === 'student_affairs') {
          navigate('/sa-dashboard', { replace: true });
        } else if (role === 'student') {
          navigate('/student-dashboard', { replace: true });
        } else if (role === 'director') {
          navigate('/director-dashboard', { replace: true });
        } else if (role === 'dean') {
          navigate('/dean-dashboard', { replace: true });
        } else if (role === 'provc' || role === 'pro_vc') {
          navigate('/provc-dashboard', { replace: true });
        } else if (role === 'vc') {
          navigate('/vc-dashboard', { replace: true });
        } else if (role === 'events_admin') {
          navigate('/events-admin-dashboard', { replace: true });
        } else if (role === 'volunteer') {
          navigate('/volunteer-dashboard', { replace: true });
        } else {
          navigate('/faculty-dashboard', { replace: true });
        }
      } else {
        setError(json.message || 'Login failed. Please try again.');
      }
    } catch {
      setError('Cannot reach the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      {/* Background decorative circles */}
      <div style={styles.circle1} />
      <div style={styles.circle2} />

      {/* Back link */}
      <Link to="/" style={styles.backLink}>
        ← Back to Home
      </Link>

      {/* Login card */}
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <span style={styles.crest}></span>
          <div>
            <p style={styles.logoName}>GM University</p>
            <p style={styles.logoSub}>Event Management System</p>
          </div>
        </div>

        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Sign in with your institutional credentials</p>

        {/* Error banner */}
        {error && (
          <div style={styles.errorBanner} role="alert">
            <span></span> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          {/* Username */}
          <div style={styles.field}>
            <label htmlFor="username" style={styles.label}>
              USERNAME
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. hod_cs"
              style={styles.input}
              autoComplete="username"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>
              PASSWORD
            </label>
            <div style={styles.passwordWrap}>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={s(styles.input, { paddingRight: '3rem' })}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={styles.eyeBtn}
                tabIndex={-1}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? (
                  /* Eye-off icon */
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  /* Eye icon */
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            style={s(styles.submitBtn, loading && styles.submitBtnLoading)}
            disabled={loading}
          >
            {loading ? (
              <>
                <span style={styles.spinner} /> Signing in…
              </>
            ) : (
              'Sign In →'
            )}
          </button>
        </form>

        <p style={styles.footNote}>
          Don't have an account?{' '}
          <span style={styles.footNoteAccent}>
            Contact your department administrator.
          </span>
        </p>
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.gradients.header,
    padding: '2rem 1rem',
    position: 'relative',
    overflowX: 'hidden',
    overflowY: 'auto',
    fontFamily: theme.fonts.sansSerif,
  },
  circle1: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(253,208,111,0.10) 0%, transparent 70%)',
    top: '-150px',
    right: '-100px',
    pointerEvents: 'none',
  },
  circle2: {
    position: 'absolute',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(253,208,111,0.07) 0%, transparent 70%)',
    bottom: '-80px',
    left: '-80px',
    pointerEvents: 'none',
  },
  backLink: {
    position: 'absolute',
    top: '1.5rem',
    left: '1.5rem',
    color: 'rgba(253,208,111,0.75)',
    fontSize: '0.85rem',
    fontWeight: theme.fontWeights.medium,
    textDecoration: 'none',
    letterSpacing: '0.02em',
    transition: theme.transitions.fast,
  },
  card: {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: theme.radii.xl,
    padding: '2rem',
    width: '100%',
    boxSizing: 'border-box',
    maxWidth: '440px',
    boxShadow: theme.shadows.lg,
    zIndex: 1,
    animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: theme.spacing.xl,
  },
  crest: {
    fontSize: '2rem',
    color: theme.colors.gold,
    lineHeight: 1,
  },
  logoName: {
    margin: 0,
    color: theme.colors.gold,
    fontFamily: theme.fonts.serif,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: '0.02em',
  },
  logoSub: {
    margin: 0,
    color: 'rgba(253,208,111,0.7)',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontWeight: theme.fontWeights.semiBold,
  },
  title: {
    margin: '0 0 0.5rem',
    color: theme.colors.white,
    fontFamily: theme.fonts.serif,
    fontSize: theme.fontSizes['2xl'],
    fontWeight: theme.fontWeights.bold,
    textAlign: 'center',
  },
  subtitle: {
    margin: `0 0 ${theme.spacing.xl}`,
    color: 'rgba(255,255,255,0.7)',
    fontSize: theme.fontSizes.sm,
    textAlign: 'center',
  },
  errorBanner: {
    background: 'rgba(198,40,40,0.15)',
    border: `1px solid ${theme.colors.error}`,
    borderRadius: theme.radii.md,
    padding: '0.75rem 1rem',
    color: '#ffb3b3', // Soft red
    fontSize: theme.fontSizes.sm,
    marginBottom: theme.spacing.lg,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    color: theme.colors.goldLight,
    fontSize: '0.75rem',
    fontWeight: theme.fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  passwordWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.9)',
    border: '2px solid transparent',
    borderRadius: theme.radii.md,
    padding: '0.75rem 1rem',
    fontSize: theme.fontSizes.base,
    color: theme.colors.charcoal,
    transition: theme.transitions.fast,
    outline: 'none',
    boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.75rem',
    background: 'transparent',
    border: 'none',
    fontSize: '1.1rem',
    cursor: 'pointer',
    color: '#555',
    opacity: 0.7,
    padding: '0.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: theme.transitions.fast,
  },
  submitBtn: {
    marginTop: theme.spacing.sm,
    width: '100%',
    boxSizing: 'border-box',
    background: theme.gradients.goldShine,
    color: theme.colors.maroon,
    border: 'none',
    borderRadius: theme.radii.full,
    padding: '0.85rem',
    fontSize: theme.fontSizes.base,
    fontWeight: theme.fontWeights.bold,
    cursor: 'pointer',
    boxShadow: theme.shadows.gold,
    transition: theme.transitions.normal,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  submitBtnLoading: {
    opacity: 0.8,
    cursor: 'wait',
  },
  spinner: {
    display: 'inline-block',
    width: '1rem',
    height: '1rem',
    border: '2px solid rgba(74,4,4,0.3)',
    borderTopColor: theme.colors.maroon,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  footNote: {
    marginTop: theme.spacing.xl,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: theme.fontSizes.sm,
  },
  footNoteAccent: {
    color: theme.colors.goldLight,
    cursor: 'pointer',
  },
};
