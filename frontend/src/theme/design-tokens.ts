/**
 * Stitch Design Tokens — single source of truth for the design system.
 *
 * These tokens are consumed by tailwind.config.ts and also exported
 * as JS constants for runtime usage (inline styles, Canvas, etc.).
 *
 * Usage:
 *   import { colors } from '@/theme/design-tokens';
 *   <div style={{ color: colors.brand[500] }} />
 */

// ---------------------------------------------------------------------------
// Color Palette
// ---------------------------------------------------------------------------

export const colors = {
  /** Brand primary — terracotta orange */
  brand: {
    50: '#fef3ef',
    100: '#fde4d7',
    200: '#fac4ad',
    300: '#f59d78',
    400: '#ef7448',
    500: '#e85d2a',
    600: '#a53c17',
    700: '#842500',
    800: '#6a1e00',
    900: '#531400',
  },

  /** Surface palette — blue-gray tones for backgrounds */
  surface: {
    DEFAULT: '#f8f9ff',
    container: '#e5eeff',
    'container-low': '#eff4ff',
    'container-high': '#dce9ff',
    'container-highest': '#d3e4fe',
    'container-lowest': '#ffffff',
  },

  /** On-surface text colors */
  onSurface: '#0b1c30',
  onSurfaceVariant: '#57423b',

  /** Outline & border colors */
  outlineVariant: '#dec0b7',

  /** Error palette */
  error: {
    DEFAULT: '#ba1a1a',
    container: '#ffdad6',
  },

  /** Success palette */
  success: {
    DEFAULT: '#2e7d32',
    container: '#e8f5e9',
  },

  /** Warning palette */
  warning: {
    DEFAULT: '#ed6c02',
    container: '#fff4e5',
  },
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const typography = {
  fontFamily: "'Inter', 'system-ui', 'sans-serif'",

  /** heading / title */
  heading: {
    fontSize: '24px',
    lineHeight: '32px',
    fontWeight: 600,
  },

  /** subtitle / body */
  body: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 400,
  },

  /** small / caption */
  caption: {
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: 500,
  },
} as const;

// ---------------------------------------------------------------------------
// Spacing & Border Radius
// ---------------------------------------------------------------------------

export const borderRadius = {
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.625rem',   // 10px
  xl: '0.75rem',    // 12px
  full: '9999px',
} as const;

export const spacing = {
  layout: {
    pageX: 'px-4 sm:px-6',
    pageY: 'py-6 sm:py-8',
    maxW: 'max-w-6xl',
  },
  card: 'p-4 sm:p-6',
} as const;
