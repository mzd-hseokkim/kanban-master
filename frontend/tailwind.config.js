/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
    },
  },
  plugins: [],
}
