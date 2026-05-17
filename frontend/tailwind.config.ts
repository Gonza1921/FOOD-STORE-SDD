import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
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
        surface: {
          DEFAULT: '#f8f9ff',
          container: '#e5eeff',
          'container-low': '#eff4ff',
          'container-high': '#dce9ff',
          'container-highest': '#d3e4fe',
          'container-lowest': '#ffffff',
        },
        'on-surface': '#0b1c30',
        'on-surface-variant': '#57423b',
        'outline-variant': '#dec0b7',
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        success: {
          DEFAULT: '#2e7d32',
          container: '#e8f5e9',
          light: '#4caf50',
        },
        info: {
          DEFAULT: '#0288d1',
          container: '#e1f5fe',
        },
        warning: {
          DEFAULT: '#ed6c02',
          container: '#fff4e5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        glass: '0 4px 30px rgba(0,0,0,0.06)',
        glow: '0 0 20px rgba(165,60,23,0.15)',
        'glow-sm': '0 0 12px rgba(165,60,23,0.10)',
        premium:
          '0 1px 3px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.04)',
        'premium-lg':
          '0 2px 8px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04), 0 24px 56px rgba(0,0,0,0.05)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'fade-in-down': 'fade-in-down 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        'slide-in-left': 'slide-in-left 0.4s ease-out',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      transitionDuration: {
        250: '250ms',
        350: '350ms',
        400: '400ms',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config
