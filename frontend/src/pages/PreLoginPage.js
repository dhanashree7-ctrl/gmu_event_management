/**
 * src/pages/PreLoginPage.js
 * -----------------------------------------------------------------
 * Public landing page for the University Event Management System.
 *
 * Features:
 *  - Fixed navigation header (maroon gradient) with animated scroll-shadow
 *  - Hero section with university crest, headline, sub-headline, & CTA
 *  - Feature cards with animated entrance on scroll (IntersectionObserver)
 *  - Stats bar showing impact numbers
 *  - Footer with quick links
 *
 * No external UI libraries are used — pure React + inline styles
 * driven by theme.js tokens.
 * -----------------------------------------------------------------
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import theme from '../theme';
import CapabilitiesFlipStack from '../components/CapabilitiesFlipStack';
import { KineticTextReveal } from '../components/KineticTextReveal';
import { MapPin, Calendar, Clock, Star, Users, CheckCircle, Plus, Info, Layout, Layers, ShieldCheck, FileImage, QrCode, Archive, Shield, Briefcase, UserPlus, FileText } from 'lucide-react';

// ─── Utility: merge style objects ────────────────────────────────────────────
const s = (...styles) => Object.assign({}, ...styles);

// ─── Data: feature cards ─────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '️',
    title: 'Role-Based Workflow',
    description:
      'Tailored dashboards for Admins, Faculty Advisors, Organizers, and Students. Every role sees exactly what it needs — nothing more, nothing less.',
    highlight: 'Multi-level approvals & permissions',
  },
  {
    icon: '',
    title: 'Automated Brochures',
    description:
      'Generate print-ready and digital event brochures instantly. Consistent university branding is applied automatically to every publication.',
    highlight: 'PDF export in one click',
  },
  {
    icon: '',
    title: 'QR Check-In',
    description:
      'Issue unique QR codes to registered participants. On-site scanning marks attendance in real time, eliminating paper lists entirely.',
    highlight: 'Live attendance dashboard',
  },
  {
    icon: '',
    title: 'Budget Tracking',
    description:
      'Submit, review, and approve event budgets through a transparent workflow. Track expenditure against allocation with visual progress charts.',
    highlight: 'Expense approval trails',
  },
  {
    icon: '',
    title: 'Historical Records',
    description:
      'A rich archive of every past event — photos, reports, attendance data, and budgets — instantly searchable and filterable by year, type, or department.',
    highlight: 'Searchable event archive',
  },
  {
    icon: '',
    title: 'User Management',
    description:
      'Seamlessly onboard and manage students, faculty, and administrators. Assign system roles and departments directly from a centralized admin dashboard.',
    highlight: 'Centralized onboarding',
  },
  {
    icon: '',
    title: 'Analytics & Reports',
    description:
      'Institution-wide event analytics: participation trends, departmental contributions, budget utilisation, and engagement metrics — all in one place.',
    highlight: 'Exportable data reports',
  },
];

// ─── Data: stats ─────────────────────────────────────────────────────────────
const STATS = [
  { value: '500+', label: 'Events Managed' },
  { value: '12K+', label: 'Participants Tracked' },
  { value: '40+', label: 'Departments Served' },
  { value: '99%', label: 'Check-In Accuracy' },
];

// ─── Data: Gallery ───────────────────────────────────────────────────────────
const GALLERY_IMAGES = [
  { title: 'Immersion Program', src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800' },
  { title: 'Group Discussion', src: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&q=80&w=800' },
  { title: 'Innovation, Design Thinking', src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800' },
  { title: 'Life Skills Training', src: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&q=80&w=800' },
  { title: 'Placement Training', src: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800' },
  { title: 'National Conference 2025', src: 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?auto=format&fit=crop&q=80&w=800' },
  { title: 'Yoga and Gymnasium', src: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800' },
  { title: 'Sports Activity - GM League', src: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=800' },
  { title: 'Mallika - 2025', src: '/assets/mallika.png' },
  { title: 'Mallika Awards', src: '/assets/mallika_awards.jpg' },
  { title: 'Kannada Kala Vaibhava - 2024', src: '/assets/kannada_kalavaibhava.png' },
  { title: 'Dandiya Nights', src: '/assets/dandiya_night.png' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Animated counter that counts up when visible */
function StatItem({ value, label }) {
  return (
    <div style={styles.statItem}>
      <span style={styles.statValue}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

/** Feature card with entrance animation via IntersectionObserver */
function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animStyle = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(40px)',
    transition: `opacity 0.55s ease ${index * 0.08}s, transform 0.55s ease ${index * 0.08}s`,
  };

  const cardStyle = s(
    styles.featureCard,
    hovered && styles.featureCardHovered,
    animStyle
  );

  return (
    <div
      ref={ref}
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Gold accent bar */}
      <div style={s(styles.cardAccent, hovered && styles.cardAccentHovered)} />

      {/* Icon bubble */}
      <div style={s(styles.iconBubble, hovered && styles.iconBubbleHovered)}>
        <span style={styles.iconEmoji}>{feature.icon}</span>
      </div>

      <h3 style={s(styles.cardTitle, hovered && styles.cardTitleHovered)}>
        {feature.title}
      </h3>
      <p style={styles.cardDesc}>{feature.description}</p>

      {/* Highlight chip */}
      <div style={styles.chip}>
        <span style={styles.chipDot} />
        {feature.highlight}
      </div>
    </div>
  );
}

function GalleryCard({ img }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={s(styles.galleryCard, hovered && { transform: 'scale(1.03)', boxShadow: '0 12px 32px rgba(0,0,0,0.15)' })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={img.src}
        alt={img.title}
        style={s(styles.galleryImage, hovered && { transform: 'scale(1.08)' })}
      />
      <div style={styles.galleryOverlay}>
        <h4 style={styles.galleryTitle}>{img.title}</h4>
      </div>
    </div>
  );
}

function WorkflowStepItem({ step, label, desc, color, isLast, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={s(
        styles.workflowStep, 
        hovered && styles.workflowStepHovered,
        { animationDelay: delay }
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={s(styles.stepBadge, { 
        background: hovered ? `linear-gradient(135deg, ${color}, #2a0000)` : '#fff',
        color: hovered ? '#fff' : color,
        border: `2px solid ${color}`,
        boxShadow: hovered ? `0 0 20px ${color}80` : '0 4px 10px rgba(0,0,0,0.05)',
        transform: hovered ? 'scale(1.15)' : 'scale(1)'
      })}>
        {step}
      </div>
      <div style={{ flex: 1 }}>
        <div style={s(styles.stepLabel, hovered && styles.stepLabelHovered)}>{label}</div>
        <div style={{
          maxHeight: hovered ? '60px' : '0',
          opacity: hovered ? 1 : 0,
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          fontSize: '0.85rem',
          color: theme.colors.darkGray,
          marginTop: hovered ? '0.25rem' : '0'
        }}>
          {desc}
        </div>
      </div>
      {!isLast && <div style={s(styles.stepConnector, hovered && styles.stepConnectorHovered)} />}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PreLoginPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef(null);
  const navigate = useNavigate();

  // Add header shadow after scrolling 10 px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Smooth-scroll to a section id
  const scrollTo = (id) => {
    if (id === 'login') { navigate('/login'); return; }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  return (
    <div style={styles.root}>

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header className="pre-login-header" style={s(styles.header, scrolled && styles.headerScrolled)}>
        <div className="header-inner" style={styles.headerInner}>

          {/* Logo */}
          <div className="pre-login-logo" style={styles.logo} onClick={() => scrollTo('hero')} role="button" tabIndex={0}>
            <Shield className="crest" style={styles.crest} size={32} />
            <div style={styles.logoText}>
              <span className="logo-name" style={styles.logoName}>GM University</span>
              <span style={styles.logoSub}>Event Management System</span>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="desktop-nav" style={styles.desktopNav} aria-label="Primary navigation">
            {['Features', 'About', 'Contact'].map((item) => (
              <button
                key={item}
                style={styles.navLink}
                onClick={() => scrollTo(item.toLowerCase())}
              >
                {item}
              </button>
            ))}
          </nav>

          {/* Login CTA */}
          <div style={styles.headerRight}>
            <LoginButton onClick={() => scrollTo('login')} />

            {/* Hamburger — mobile only */}
            <button
              className="hamburger"
              style={styles.hamburger}
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="Toggle navigation"
            >
              <span style={s(styles.hamburgerLine, mobileMenuOpen && styles.hamburgerLineTop)} />
              <span style={s(styles.hamburgerLine, mobileMenuOpen && styles.hamburgerLineMiddle)} />
              <span style={s(styles.hamburgerLine, mobileMenuOpen && styles.hamburgerLineBottom)} />
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div style={styles.mobileMenu}>
            {['Features', 'About', 'Contact'].map((item) => (
              <button
                key={item}
                style={styles.mobileNavLink}
                onClick={() => scrollTo(item.toLowerCase())}
              >
                {item}
              </button>
            ))}
            <LoginButton onClick={() => scrollTo('login')} fullWidth />
          </div>
        )}
      </header>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section id="hero" ref={heroRef} style={styles.hero}>
        <style>
          {`
            @keyframes cinematic-pan {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes float-blob {
              0% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(30px, -50px) scale(1.1); }
              66% { transform: translate(-20px, 20px) scale(0.9); }
              100% { transform: translate(0, 0) scale(1); }
            }
          `}
        </style>
        {/* Glowing Orbs */}
        <div style={styles.heroBgCircle1} />
        <div style={styles.heroBgCircle2} />
        <div style={styles.heroBgCircle3} />

        <div style={styles.heroContent}>
          {/* Badge */}
          <div style={styles.heroBadge}>
            <span style={styles.heroBadgeDot} />
            Official University Platform
          </div>

          <h1 style={styles.heroHeadline}>
            <KineticTextReveal
              text="Orchestrate Every Event"
              splitBy="words"
              direction="up"
              stagger={0.1}
            />
            <br />
            <span style={styles.heroHeadlineAccent}>
              <KineticTextReveal
                text="with Precision & Pride"
                splitBy="words"
                direction="up"
                stagger={0.1}
                delay={0.3}
              />
            </span>
          </h1>

          <p style={styles.heroSubtitle}>
            A unified digital platform for planning, managing, and celebrating
            university events — from intimate seminars to grand cultural fests.
          </p>

          <div style={styles.heroCTAs}>
            <button style={styles.ctaPrimary} onClick={() => scrollTo('login')}>
              Get Started →
            </button>
            <button style={styles.ctaSecondary} onClick={() => scrollTo('features')}>
              Explore Features
            </button>
          </div>

          {/* Stats strip */}
          <div style={styles.heroStats}>
            {STATS.map((stat, i) => (
              <React.Fragment key={stat.label}>
                <StatItem {...stat} />
                {i < STATS.length - 1 && <div style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={styles.scrollIndicator} onClick={() => scrollTo('gallery')} role="button" tabIndex={0} aria-label="Scroll to features">
          <div style={styles.scrollMouse}>
            <div style={styles.scrollWheel} />
          </div>
          <span style={styles.scrollText}>Scroll to explore</span>
        </div>
      </section>

      {/* ── CONTENT WRAPPER FOR CURTAIN REVEAL ────────────────── */}
      <div style={{ position: 'relative', zIndex: 10, backgroundColor: theme.colors.offWhite, boxShadow: '0 -20px 40px rgba(0,0,0,0.3)' }}>


        {/* ── GALLERY: The Creative Lens ──────────────────────────── */}
        <section id="gallery" style={styles.gallerySection}>
          <div style={styles.sectionContainer}>
            <div style={{ textAlign: 'center', marginBottom: '4rem', position: 'relative', zIndex: 2 }}>
              <h2 style={{ fontSize: '3rem', color: theme.colors.charcoal, fontWeight: 'bold', fontFamily: theme.fonts.sansSerif, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                The Creative Lens
              </h2>
              <div style={{ width: '80px', height: '4px', background: theme.colors.gold, margin: '0 auto 1.25rem', borderRadius: '2px' }} />
              <p style={{ fontSize: '1.15rem', color: theme.colors.darkGray }}>Every Frame Tells a Story of Innovation</p>
            </div>

            <div style={styles.galleryGrid}>
              {GALLERY_IMAGES.map((img, idx) => (
                <GalleryCard key={idx} img={img} />
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES / CAPABILITIES ─────────────────────────────── */}
        <section id="features" style={{ backgroundColor: theme.colors.offWhite }}>
          <CapabilitiesFlipStack />
        </section>

        {/* ── ABOUT / HOW IT WORKS ────────────────────────────────── */}
        <section id="about" style={styles.aboutSection}>
          {/* Background Blobs */}
          <div style={styles.aboutBgCircle1} />
          <div style={styles.aboutBgCircle2} />

          <div style={styles.aboutContainer}>
            <div style={styles.aboutText}>
              <span style={styles.sectionTag}>About the Platform</span>
              <h2 style={styles.aboutTitle}>
                Designed for the Rhythm of Academic Life
              </h2>
              <p style={styles.aboutDesc}>
                The University Event Management System was built in close collaboration
                with student organisers, faculty advisors, and administrative staff to
                reflect how events actually happen on campus. Every workflow reflects
                real approval chains, real budget constraints, and real attendance needs.
              </p>
              <ul style={styles.aboutList}>
                {[
                  'Submit event proposals with structured forms',
                  'Route approvals automatically to the right authority',
                  'Generate participant QR codes in bulk',
                  'Publish final reports to the institutional archive',
                ].map((item) => (
                  <li key={item} style={styles.aboutListItem}>
                    <CheckCircle style={styles.checkIcon} size={16} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div style={styles.aboutVisual}>
              <div style={styles.workflowCard}>
                <h4 style={styles.workflowTitle}>Typical Event Lifecycle</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { step: '01', label: 'Proposal Submitted', desc: 'Students submit a detailed event brief.', color: theme.colors.maroon },
                    { step: '02', label: 'Faculty Approval', desc: 'Faculty reviews and endorses the plan.', color: '#D84315' },
                    { step: '03', label: 'Admin Sign-off', desc: 'Final logistical & budget approval.', color: '#C62828' },
                    { step: '04', label: 'Brochure Generated', desc: 'AI creates promotional materials.', color: theme.colors.gold },
                    { step: '05', label: 'QR Check-In Live', desc: 'Seamless day-of-event entry.', color: theme.colors.goldDark },
                    { step: '06', label: 'Report Archived', desc: 'Automated post-event reporting.', color: '#2E7D32' },
                  ].map(({ step, label, desc, color }, i, arr) => (
                    <WorkflowStepItem key={step} step={step} label={label} desc={desc} color={color} isLast={i === arr.length - 1} delay={`${i * 0.1}s`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── LOGIN PROMPT ────────────────────────────────────────── */}
        <section id="login-section" style={styles.loginSection}>
          <div style={styles.loginCard}>
            <div style={styles.loginCardIcon}><ShieldCheck size={48} color="#D4AF37" /></div>
            <h2 style={styles.loginCardTitle}>Ready to get started?</h2>
              <p style={{ color: '#ecf0f1', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '25px', opacity: 0.9 }}>
                Sign in with your institutional ID to access your personalised dashboard.
              </p>
            <button
              style={styles.loginCardBtn}
              onClick={() => navigate('/login')}
            >
              Sign In to Your Account
            </button>
            <p style={styles.loginCardNote}>
              Don't have an account? Contact your department administrator.
            </p>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <footer id="contact" style={styles.footer}>
          <div style={styles.footerInner}>
            <div style={styles.footerBrand}>
              <span style={styles.footerLogo}> GM University</span>
              <p style={styles.footerTagline}>
                Innovating Minds.
              </p>
            </div>

            <div style={styles.footerLinks}>
              <h4 style={styles.footerLinksTitle}>Quick Links</h4>
              {['Home', 'Features', 'About', 'Contact'].map((link) => (
                <button
                  key={link}
                  style={styles.footerLink}
                  onClick={() => scrollTo(link.toLowerCase())}
                >
                  {link}
                </button>
              ))}
            </div>

            <div style={styles.footerContact}>
              <h4 style={styles.footerLinksTitle}>Contact</h4>
              <p style={styles.footerContactText}>events@gm.edu</p>
              <p style={styles.footerContactText}>+91 (0) 98765 43210</p>
              <p style={styles.footerContactText}>Campus Administrative Block, Room 204</p>
            </div>
          </div>

          <div style={styles.footerBottom}>
            <span> {new Date().getFullYear()} GM University. All rights reserved.</span>
            <span>University Event Management System v1.0</span>
          </div>
        </footer>
      </div> {/* End of Content Wrapper */}
    </div>
  );
}

// ─── Gold Login Button ────────────────────────────────────────────────────────
function LoginButton({ onClick, fullWidth }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      style={s(styles.loginBtn, hovered && styles.loginBtnHovered, fullWidth && styles.loginBtnFull)}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      Login
    </button>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  // Root
  root: {
    fontFamily: theme.fonts.sansSerif,
    backgroundColor: theme.colors.offWhite,
    color: theme.colors.darkGray,
  },

  // ── Header ────────────────────────────────────────────────────
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: theme.gradients.header,
    transition: theme.transitions.normal,
  },
  headerScrolled: {
    boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
  },
  headerInner: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 1.5rem',
    height: '72px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },

  // Logo
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    userSelect: 'none',
  },
  crest: {
    fontSize: '2rem',
    color: theme.colors.gold,
    lineHeight: 1,
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column',
  },
  logoName: {
    fontFamily: theme.fonts.sansSerif,
    fontSize: '1.15rem',
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.gold,
    lineHeight: 1.1,
    letterSpacing: '0.02em',
  },
  logoSub: {
    fontSize: '0.65rem',
    color: 'rgba(253,208,111,0.75)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },

  // Desktop nav
  desktopNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    '@media (max-width: 768px)': { display: 'none' },
  },
  navLink: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.85)',
    fontSize: '0.9rem',
    fontWeight: theme.fontWeights.medium,
    cursor: 'pointer',
    padding: '0.5rem 0.85rem',
    borderRadius: theme.radii.md,
    transition: theme.transitions.fast,
    letterSpacing: '0.02em',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },

  // Gold Login button
  loginBtn: {
    background: theme.colors.gold,
    color: theme.colors.maroonDark,
    border: 'none',
    borderRadius: theme.radii.full,
    padding: '0.55rem 1.5rem',
    fontWeight: theme.fontWeights.semiBold,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: theme.transitions.fast,
    letterSpacing: '0.03em',
    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
    whiteSpace: 'nowrap',
  },
  loginBtnHovered: {
    background: theme.colors.goldDark,
    transform: 'translateY(-1px)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
  },
  loginBtnFull: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: theme.radii.md,
    marginTop: '0.5rem',
  },

  // Hamburger
  hamburger: {
    display: 'none',
    flexDirection: 'column',
    gap: '5px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: theme.radii.sm,
    '@media (max-width: 768px)': { display: 'flex' },
  },
  hamburgerLine: {
    width: '22px',
    height: '2px',
    background: theme.colors.gold,
    borderRadius: '2px',
    transition: theme.transitions.fast,
    display: 'block',
  },
  hamburgerLineTop: { transform: 'rotate(45deg) translate(5px, 5px)' },
  hamburgerLineMiddle: { opacity: 0 },
  hamburgerLineBottom: { transform: 'rotate(-45deg) translate(5px, -5px)' },

  // Mobile menu
  mobileMenu: {
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem 1.5rem 1.5rem',
    borderTop: '1px solid rgba(253,208,111,0.2)',
    background: theme.colors.maroonDark,
    gap: '0.25rem',
  },
  mobileNavLink: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.9)',
    fontSize: '1rem',
    fontWeight: theme.fontWeights.medium,
    cursor: 'pointer',
    padding: '0.75rem 0',
    textAlign: 'left',
    borderBottom: '1px solid rgba(253,208,111,0.1)',
  },



  // ── Hero ───────────────────────────────────────────────────────
  hero: {
    position: 'sticky',
    top: 0,
    zIndex: 0,
    height: '100dvh', // Use viewport height
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(225deg, rgba(74, 4, 4, 0.95) 0%, rgba(30, 0, 0, 0.95) 40%, rgba(15, 0, 0, 0.98) 100%), url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=2000')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    overflow: 'hidden',
    paddingTop: '60px', // Allow breathing room
    boxSizing: 'border-box', // Ensure padding doesn't increase height
    animation: 'cinematic-pan 30s ease-in-out infinite',
  },
  heroBgCircle1: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'rgba(253, 208, 111, 0.1)',
    filter: 'blur(120px)',
    top: '-100px',
    right: '-150px',
    pointerEvents: 'none',
    animation: 'float-blob 15s ease-in-out infinite',
  },
  heroBgCircle2: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'rgba(107, 26, 26, 0.4)',
    filter: 'blur(100px)',
    bottom: '10%',
    left: '-100px',
    pointerEvents: 'none',
    animation: 'float-blob 18s ease-in-out infinite reverse',
  },
  heroBgCircle3: {
    position: 'absolute',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'rgba(253, 208, 111, 0.08)',
    filter: 'blur(90px)',
    top: '30%',
    left: '20%',
    pointerEvents: 'none',
    animation: 'float-blob 20s ease-in-out infinite 2s',
  },
  heroContent: {
    maxWidth: '820px',
    textAlign: 'center',
    padding: '2rem 1.5rem 2rem',
    position: 'relative',
    zIndex: 1,
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: theme.colors.white,
    borderRadius: theme.radii.full,
    padding: '0.4rem 1.1rem',
    fontSize: '0.75rem',
    fontWeight: theme.fontWeights.medium,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: '1rem',
  },
  heroBadgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: theme.colors.gold,
    display: 'inline-block',
  },
  heroHeadline: {
    fontFamily: theme.fonts.sansSerif,
    fontSize: 'clamp(2.2rem, 5.2vw, 3.4rem)',
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.white,
    lineHeight: 1.15,
    marginBottom: '1.25rem',
    letterSpacing: '-0.02em',
  },
  heroHeadlineAccent: {
    color: theme.colors.gold,
    display: 'block',
    fontWeight: theme.fontWeights.semiBold,
  },
  heroSubtitle: {
    fontSize: 'clamp(1rem, 2vw, 1.2rem)',
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 1.7,
    marginBottom: '1.5rem',
    maxWidth: '620px',
    margin: '0 auto 1.5rem',
  },
  heroCTAs: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '2rem',
  },
  ctaPrimary: {
    background: theme.gradients.goldShine,
    color: theme.colors.maroonDark,
    border: 'none',
    borderRadius: theme.radii.full,
    padding: '0.9rem 2.4rem',
    fontSize: '1.05rem',
    fontWeight: theme.fontWeights.bold,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(253,208,111,0.3)',
    transition: theme.transitions.normal,
    letterSpacing: '0.01em',
  },
  ctaSecondary: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(8px)',
    color: theme.colors.white,
    border: `1px solid rgba(255,255,255,0.2)`,
    borderRadius: theme.radii.full,
    padding: '0.9rem 2.4rem',
    fontSize: '1.05rem',
    fontWeight: theme.fontWeights.medium,
    cursor: 'pointer',
    transition: theme.transitions.normal,
    letterSpacing: '0.02em',
  },

  heroStats: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    background: 'rgba(20, 0, 0, 0.4)',
    backdropFilter: 'blur(16px)',
    borderRadius: theme.radii.xl,
    border: '1px solid rgba(253, 208, 111, 0.15)',
    boxShadow: '0 16px 32px rgba(0,0,0,0.3)',
    padding: '1rem 1.5rem',
    maxWidth: '800px',
    margin: '0 auto',
    gap: '1.5rem',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0.5rem 1rem',
  },
  statDivider: {
    width: '1px',
    height: '40px',
    background: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    fontFamily: theme.fonts.sansSerif,
    fontSize: '1.7rem',
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.goldLight,
    lineHeight: 1,
    textShadow: '0 0 20px rgba(253,208,111,0.4)',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.7)',
    marginTop: '0.4rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  // Scroll indicator
  scrollIndicator: {
    position: 'absolute',
    bottom: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    cursor: 'pointer',
    animation: 'bounceY 2s ease-in-out infinite',
  },
  scrollMouse: {
    width: '24px',
    height: '38px',
    border: '2px solid rgba(253,208,111,0.5)',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '6px',
  },
  scrollWheel: {
    width: '4px',
    height: '8px',
    background: theme.colors.gold,
    borderRadius: '2px',
    animation: 'scrollWheel 1.5s ease-in-out infinite',
  },
  scrollText: {
    fontSize: '0.7rem',
    color: 'rgba(253,208,111,0.6)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },

  // ── Gallery section ───────────────────────────────────────────
  gallerySection: {
    padding: '8rem 1.5rem 6rem',
    backgroundColor: '#fff',
    position: 'relative',
  },
  galleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '2rem',
  },
  galleryCard: {
    position: 'relative',
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
    height: '260px',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.6s ease',
  },
  galleryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, rgba(15,0,0,0.9) 0%, rgba(15,0,0,0.5) 60%, transparent 100%)',
    padding: '2.5rem 1.5rem 1.25rem',
    display: 'flex',
    alignItems: 'flex-end',
    transition: 'padding 0.4s ease',
  },
  galleryTitle: {
    margin: 0,
    color: theme.colors.goldLight,
    fontSize: '1.2rem',
    fontWeight: theme.fontWeights.bold,
    fontFamily: theme.fonts.sansSerif,
    textShadow: '0 2px 10px rgba(0,0,0,0.8)',
    lineHeight: 1.3,
  },

  // ── Features section ──────────────────────────────────────────
  featuresSection: {
    padding: '6rem 1.5rem',
    backgroundColor: theme.colors.offWhite,
  },
  sectionContainer: {
    maxWidth: '1280px',
    margin: '0 auto',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '3.5rem',
  },
  sectionTag: {
    display: 'inline-block',
    background: theme.colors.goldLight,
    color: theme.colors.maroon,
    borderRadius: theme.radii.full,
    padding: '0.3rem 1rem',
    fontSize: '0.75rem',
    fontWeight: theme.fontWeights.bold,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    marginBottom: '1rem',
  },
  sectionTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.charcoal,
    marginBottom: '0.75rem',
    lineHeight: 1.25,
  },
  sectionSubtitle: {
    fontSize: '1.05rem',
    color: theme.colors.midGray,
    maxWidth: '540px',
    margin: '0 auto',
    lineHeight: 1.65,
  },

  // Feature grid
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  featureCard: {
    background: '#ffffff',
    borderRadius: theme.radii.lg,
    padding: '2rem',
    boxShadow: theme.shadows.sm,
    border: '1px solid #ede9e3',
    cursor: 'default',
    position: 'relative',
    overflow: 'hidden',
    transition: theme.transitions.normal,
  },
  featureCardHovered: {
    boxShadow: '0 20px 40px rgba(128, 0, 0, 0.1)',
    transform: 'translateY(-8px) scale(1.02)',
    borderColor: theme.colors.goldLight,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: theme.colors.lightGray,
    transition: theme.transitions.normal,
  },
  cardAccentHovered: {
    background: theme.gradients.goldShine,
  },
  iconBubble: {
    width: '52px',
    height: '52px',
    borderRadius: theme.radii.lg,
    background: theme.colors.lightGray,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.25rem',
    transition: theme.transitions.normal,
  },
  iconBubbleHovered: {
    background: theme.colors.goldLight,
  },
  iconEmoji: {
    fontSize: '1.6rem',
  },
  cardTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: '1.2rem',
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.charcoal,
    marginBottom: '0.75rem',
    transition: theme.transitions.fast,
  },
  cardTitleHovered: {
    color: theme.colors.maroon,
  },
  cardDesc: {
    fontSize: '0.9rem',
    lineHeight: 1.7,
    color: theme.colors.darkGray,
    marginBottom: '1.25rem',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    background: theme.colors.goldLight,
    color: '#7a4a00',
    borderRadius: theme.radii.full,
    padding: '0.28rem 0.8rem',
    fontSize: '0.75rem',
    fontWeight: theme.fontWeights.semiBold,
  },
  chipDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: theme.colors.goldDark,
    flexShrink: 0,
  },

  // ── About section ─────────────────────────────────────────────
  aboutSection: {
    background: theme.colors.offWhite,
    padding: '8rem 1.5rem',
    position: 'relative',
    overflow: 'hidden',
  },
  aboutBgCircle1: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'rgba(253, 208, 111, 0.15)',
    filter: 'blur(120px)',
    top: '-100px',
    left: '-200px',
    pointerEvents: 'none',
  },
  aboutBgCircle2: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'rgba(107, 26, 26, 0.08)',
    filter: 'blur(100px)',
    bottom: '-100px',
    right: '-150px',
    pointerEvents: 'none',
  },
  aboutContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4rem',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  aboutText: {},
  aboutTitle: {
    fontFamily: theme.fonts.sansSerif,
    fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
    fontWeight: theme.fontWeights.bold,
    background: 'linear-gradient(90deg, #4A0404 0%, #B78A28 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '1rem',
    lineHeight: 1.2,
    marginTop: '0.75rem',
    letterSpacing: '-0.02em',
  },
  aboutDesc: {
    fontSize: '1.05rem',
    lineHeight: 1.75,
    color: theme.colors.darkGray,
    marginBottom: '2rem',
  },
  aboutList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  aboutListItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    fontSize: '1rem',
    color: theme.colors.charcoal,
    lineHeight: 1.5,
    fontWeight: theme.fontWeights.medium,
  },
  checkIcon: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4A0404, #7B1E1E)',
    color: theme.colors.goldLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: theme.fontWeights.bold,
    flexShrink: 0,
    boxShadow: '0 4px 10px rgba(74,4,4,0.2)',
  },

  // Workflow card
  aboutVisual: {
    position: 'relative',
  },
  workflowCard: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(24px)',
    borderRadius: theme.radii.xl,
    padding: '2.5rem',
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    position: 'relative',
    zIndex: 2,
  },
  workflowTitle: {
    fontFamily: theme.fonts.sansSerif,
    fontSize: '1.3rem',
    color: theme.colors.charcoal,
    marginBottom: '2rem',
    fontWeight: theme.fontWeights.bold,
    letterSpacing: '-0.01em',
  },
  workflowStep: {
    display: 'flex',
    alignItems: 'flex-start', // Changed for description expansion
    gap: '1.25rem',
    position: 'relative',
    padding: '0.75rem 0.5rem 0.75rem 0',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    borderRadius: theme.radii.md,
  },
  workflowStepHovered: {
    transform: 'translateX(12px)',
    background: 'rgba(255,255,255,0.6)',
  },
  stepBadge: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    fontWeight: theme.fontWeights.bold,
    flexShrink: 0,
    letterSpacing: '0.04em',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 2,
  },
  stepLabel: {
    fontSize: '1.05rem',
    color: theme.colors.charcoal,
    fontWeight: theme.fontWeights.bold,
    flex: 1,
    transition: 'color 0.3s ease',
    paddingTop: '10px', // Align with badge center
  },
  stepLabelHovered: {
    color: theme.colors.maroon,
  },
  stepConnector: {
    position: 'absolute',
    left: '21px', // Centered under 44px badge (44/2 - 1)
    top: '48px', // Start below badge
    width: '2px',
    height: 'calc(100% - 30px)', // Dynamic height
    background: '#e0e0e0',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 1,
  },
  stepConnectorHovered: {
    background: theme.gradients.goldShine,
    boxShadow: '0 0 12px rgba(253,208,111,0.8)',
    width: '3px',
    left: '20.5px',
  },

  // ── Login section ─────────────────────────────────────────────
  loginSection: {
    background: theme.gradients.header,
    padding: '6rem 1.5rem',
    display: 'flex',
    justifyContent: 'center',
  },
  loginCard: {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(253,208,111,0.2)',
    borderRadius: theme.radii.xl,
    padding: '3rem 2.5rem',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
  },
  loginCardIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  loginCardTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: '1.8rem',
    color: theme.colors.white,
    marginBottom: '0.75rem',
    fontWeight: theme.fontWeights.bold,
  },
  loginCardDesc: {
    fontSize: '0.95rem',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.65,
    marginBottom: '2rem',
  },
  loginCardBtn: {
    background: theme.colors.gold,
    color: theme.colors.maroon,
    border: 'none',
    borderRadius: theme.radii.full,
    padding: '0.9rem 2.5rem',
    fontSize: '1rem',
    fontWeight: theme.fontWeights.bold,
    cursor: 'pointer',
    width: '100%',
    boxShadow: theme.shadows.gold,
    transition: theme.transitions.normal,
    marginBottom: '1.25rem',
    letterSpacing: '0.02em',
  },
  loginCardNote: {
    fontSize: '0.82rem',
    color: 'rgba(255,255,255,0.45)',
  },

  // ── Footer ────────────────────────────────────────────────────
  footer: {
    background: theme.colors.charcoal,
    color: 'rgba(255,255,255,0.7)',
    padding: '3.5rem 1.5rem 1.5rem',
  },
  footerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gap: '2.5rem',
    paddingBottom: '2.5rem',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '1.5rem',
  },
  footerBrand: {},
  footerLogo: {
    fontFamily: theme.fonts.serif,
    fontSize: '1.15rem',
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.gold,
    display: 'block',
    marginBottom: '0.75rem',
  },
  footerTagline: {
    fontSize: '0.875rem',
    lineHeight: 1.65,
    maxWidth: '280px',
  },
  footerLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  footerLinksTitle: {
    color: theme.colors.goldLight,
    fontSize: '0.85rem',
    fontWeight: theme.fontWeights.semiBold,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: '0.5rem',
  },
  footerLink: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    textAlign: 'left',
    padding: '0.2rem 0',
    transition: theme.transitions.fast,
  },
  footerContact: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  footerContactText: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
  },
  footerBottom: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.5rem',
    fontSize: '0.78rem',
    color: 'rgba(255,255,255,0.35)',
  },
};
