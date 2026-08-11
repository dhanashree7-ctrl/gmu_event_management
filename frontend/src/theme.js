/**
 * src/theme.js
 * -----------------------------------------------------------------
 * Single source of truth for the University Event Management System
 * design language.
 *
 * Import anywhere:
 *   import theme from './theme';
 *   const bg = theme.colors.maroon;
 * -----------------------------------------------------------------
 */

const theme = {
  // ── Brand colours ──────────────────────────────────────────────
  colors: {
    // Primary palette — university identity
    maroon:      '#4A0404',   // deep maroon — primary background / headers
    maroonDark:  '#3C1818',   // dark brown  — gradients, hover states
    maroonLight: '#6B1A1A',   // lighter maroon — subtle highlights
    gold:        '#FDD06F',   // gold  — primary accent, CTAs
    goldDark:    '#E8B84B',   // darker gold — hover state for gold elements
    goldLight:   '#FEE3A0',   // pale gold — backgrounds, chips

    // Neutrals
    white:       '#FFFFFF',
    offWhite:    '#FAF8F5',   // warm white — page backgrounds
    lightGray:   '#F0EDE8',   // section alternating backgrounds
    midGray:     '#9E9E9E',   // placeholder / muted text
    darkGray:    '#4A4A4A',   // body copy
    charcoal:    '#1E1E1E',   // headings on light backgrounds

    // Semantic
    success:     '#2E7D32',
    warning:     '#F57C00',
    error:       '#C62828',
    info:        '#1565C0',
  },

  // ── Typography ─────────────────────────────────────────────────
  fonts: {
    serif:      "'EB Garamond', 'Palatino Linotype', Georgia, serif",
    sansSerif:  "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    mono:       "'JetBrains Mono', 'Fira Code', monospace",
  },

  // ── Font weights ───────────────────────────────────────────────
  fontWeights: {
    regular:    400,
    medium:     500,
    semiBold:   600,
    bold:       700,
    extraBold:  800,
  },

  // ── Font sizes (rem) ───────────────────────────────────────────
  fontSizes: {
    xs:   '0.75rem',    //  12px
    sm:   '0.875rem',   //  14px
    base: '1rem',       //  16px
    md:   '1.125rem',   //  18px
    lg:   '1.25rem',    //  20px
    xl:   '1.5rem',     //  24px
    '2xl':'1.875rem',   //  30px
    '3xl':'2.25rem',    //  36px
    '4xl':'3rem',       //  48px
    '5xl':'3.75rem',    //  60px
  },

  // ── Spacing scale (rem) ────────────────────────────────────────
  spacing: {
    xs:   '0.25rem',
    sm:   '0.5rem',
    md:   '1rem',
    lg:   '1.5rem',
    xl:   '2rem',
    '2xl':'3rem',
    '3xl':'4rem',
    '4xl':'6rem',
  },

  // ── Border radii ───────────────────────────────────────────────
  radii: {
    sm:   '4px',
    md:   '8px',
    lg:   '12px',
    xl:   '20px',
    full: '9999px',
  },

  // ── Shadows ────────────────────────────────────────────────────
  shadows: {
    sm:   '0 1px 3px rgba(0,0,0,0.12)',
    md:   '0 4px 12px rgba(0,0,0,0.15)',
    lg:   '0 8px 32px rgba(74,4,4,0.18)',
    gold: '0 4px 20px rgba(253,208,111,0.35)',
  },

  // ── Transitions ────────────────────────────────────────────────
  transitions: {
    fast:   'all 0.15s ease',
    normal: 'all 0.25s ease',
    slow:   'all 0.4s ease',
  },

  // ── Breakpoints ────────────────────────────────────────────────
  breakpoints: {
    sm:  '480px',
    md:  '768px',
    lg:  '1024px',
    xl:  '1280px',
    '2xl':'1536px',
  },

  // ── Gradients ──────────────────────────────────────────────────
  gradients: {
    header:    'linear-gradient(135deg, #4A0404 0%, #3C1818 60%, #6B1A1A 100%)',
    heroOverlay:'linear-gradient(180deg, rgba(74,4,4,0.82) 0%, rgba(60,24,24,0.70) 100%)',
    goldShine: 'linear-gradient(90deg, #FDD06F 0%, #FEE3A0 50%, #FDD06F 100%)',
    card:      'linear-gradient(145deg, #ffffff 0%, #faf8f5 100%)',
  },
};

export default theme;
