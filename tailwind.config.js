/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          darkBg: '#090d16',
          panelDark: '#111827',
          accentBlue: '#3b82f6',
          accentPink: '#f472b6',
        },
      },
      boxShadow: {
        glow: '0 35px 120px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
};