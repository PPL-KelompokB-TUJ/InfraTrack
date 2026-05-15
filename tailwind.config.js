/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#ecfeff',
          100: '#cffafe',
          300: '#67e8f9',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          900: '#164e63'
        },
        /* Material Design 3 token colors */
        'surface': '#f8f9ff',
        'surface-dim': '#cbdbf5',
        'surface-bright': '#f8f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#eff4ff',
        'surface-container': '#e5eeff',
        'surface-container-high': '#dce9ff',
        'surface-container-highest': '#d3e4fe',
        'on-surface': '#0b1c30',
        'on-surface-variant': '#3e484d',
        'inverse-surface': '#213145',
        'inverse-on-surface': '#eaf1ff',
        'outline': '#6e797e',
        'outline-variant': '#bdc8ce',
        'surface-tint': '#006780',
        'primary': '#00647c',
        'on-primary': '#ffffff',
        'primary-container': '#007f9d',
        'on-primary-container': '#fafdff',
        'inverse-primary': '#6cd3f7',
        'secondary': '#006a61',
        'on-secondary': '#ffffff',
        'secondary-container': '#86f2e4',
        'on-secondary-container': '#006f66',
        'tertiary': '#4648d4',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#6063ee',
        'on-tertiary-container': '#fffbff',
        'error': '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        'primary-fixed': '#b7eaff',
        'primary-fixed-dim': '#6cd3f7',
        'on-primary-fixed': '#001f28',
        'on-primary-fixed-variant': '#004e61',
        'secondary-fixed': '#89f5e7',
        'secondary-fixed-dim': '#6bd8cb',
        'on-secondary-fixed': '#00201d',
        'on-secondary-fixed-variant': '#005049',
        'tertiary-fixed': '#e1e0ff',
        'tertiary-fixed-dim': '#c0c1ff',
        'on-tertiary-fixed': '#07006c',
        'on-tertiary-fixed-variant': '#2f2ebe',
        'background': '#f8f9ff',
        'on-background': '#0b1c30',
        'surface-variant': '#d3e4fe',
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
