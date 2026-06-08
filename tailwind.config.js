/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
        body: ['system-ui', 'sans-serif'],
      },
      colors: {
        summit: {
          50: '#f0f7e6', 100: '#d9ecbf', 200: '#b8d98a',
          500: '#639922', 600: '#4a7a18', 700: '#3B6D11', 800: '#2d5409',
        },
        glacier: {
          50: '#e1f5ee', 400: '#1D9E75', 600: '#0F6E56', 800: '#085041',
        },
        altitude: {
          50: '#faeeda', 400: '#EF9F27', 600: '#BA7517', 800: '#633806',
        },
        danger: { 50: '#fcebeb', 600: '#A32D2D' },
        rock: { 100: '#F1EFE8', 400: '#888780', 700: '#444441', 900: '#2C2C2A' },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      }
    },
  },
  plugins: [],
}
