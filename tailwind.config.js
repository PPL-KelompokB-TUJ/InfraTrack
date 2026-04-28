/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfeff',
          100: '#cffafe',
          300: '#67e8f9',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          900: '#164e63'
        }
      },
      boxShadow: {
        glow: '0 8px 30px rgba(6, 182, 212, 0.25)'
      },
      keyframes: {
        fadeInSlideIn: {
          '0%': {
            opacity: '0',
            transform: 'translateX(100px) translateY(-10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0) translateY(0)'
          }
        }
      },
      animation: {
        fadeInSlideIn: 'fadeInSlideIn 0.3s ease-out forwards'
      }
    },
  },
  plugins: [],
};
