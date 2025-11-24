/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'Helvetica Neue',
          'Segoe UI',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'Malgun Gothic',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'sans-serif',
        ],
      },
      spacing: {
        '0.5': '2px',   // 0.5 unit
        '1': '4px',     // 1 unit
        '1.5': '6px',   // 1.5 units
        '2': '8px',     // 2 units
        '2.5': '10px',  // 2.5 units
        '3': '12px',    // 3 units
        '3.5': '14px',  // 3.5 units
        '4': '16px',    // 4 units
        '5': '20px',    // 5 units
        '6': '24px',    // 6 units
        '7': '28px',    // 7 units
        '8': '32px',    // 8 units
        '9': '36px',    // 9 units
        '10': '40px',   // 10 units
        '11': '44px',   // 11 units
        '12': '48px',   // 12 units
        '14': '56px',   // 14 units
        '16': '64px',   // 16 units
        '20': '80px',   // 20 units
        '24': '96px',   // 24 units
        '28': '112px',  // 28 units
        '32': '128px',  // 32 units
        '36': '144px',  // 36 units
        '40': '160px',  // 40 units
        '44': '176px',  // 44 units
        '48': '192px',  // 48 units
        '52': '208px',  // 52 units
        '56': '224px',  // 56 units
        '60': '240px',  // 60 units
        '64': '256px',  // 64 units
        '72': '288px',  // 72 units
        '80': '320px',  // 80 units
        '96': '384px',  // 96 units
      },
      textColor: {
        'heading': 'var(--text-heading)',
        'body': 'var(--text-body)',
        'meta': 'var(--text-meta)',
        'muted': 'var(--text-muted)',
      },
      colors: {
        // Pastel Cool Color Palette
        pastel: {
          blue: {
            50: '#f0f7ff',
            100: '#e0efff',
            200: '#b9ddff',
            300: '#7cc0ff',
            400: '#3da2ff',
            500: '#0e7fff',
            600: '#0066dd',
            700: '#0052b3',
            800: '#004494',
            900: '#00387a',
          },
          purple: {
            50: '#f8f5ff',
            100: '#f0ebff',
            200: '#e3d9ff',
            300: '#cabdff',
            400: '#aa94ff',
            500: '#8b6cff',
            600: '#7047f7',
            700: '#5e34e0',
            800: '#4e2bbb',
            900: '#412699',
          },
          cyan: {
            50: '#f0fdff',
            100: '#dbf8ff',
            200: '#bef2ff',
            300: '#8de9ff',
            400: '#54d8ff',
            500: '#2abeff',
            600: '#1a9df5',
            700: '#1a7ed4',
            800: '#1d66ab',
            900: '#1e558d',
          },
          mint: {
            50: '#f0fffd',
            100: '#ccfff8',
            200: '#99fff1',
            300: '#5ffae8',
            400: '#2de9d8',
            500: '#13ccbe',
            600: '#0ba89b',
            700: '#0d847c',
            800: '#106864',
            900: '#135653',
          },
          pink: {
            50: '#fff5f9',
            100: '#ffebf5',
            200: '#ffd6ed',
            300: '#ffb3dd',
            400: '#ff85c7',
            500: '#ff5ab0',
            600: '#f0388e',
            700: '#d12171',
            800: '#ad1d5e',
            900: '#911e51',
          },
          yellow: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
          },
          green: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
          },
          red: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
          },
          orange: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#f97316',
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-pastel': 'linear-gradient(135deg, #e0efff 0%, #f0ebff 50%, #dbf8ff 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.1)',
        'glass-lg': '0 12px 48px 0 rgba(31, 38, 135, 0.2)',
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
