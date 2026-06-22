/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        "headline-lg-mobile": ["Playfair Display"],
        "body-lg": ["Inter"],
        "headline-sm": ["Playfair Display"],
        "label-md": ["Inter"],
        "headline-lg": ["Playfair Display"],
        "body-sm": ["Inter"],
        "body-md": ["Inter"],
        "headline-md": ["Playfair Display"]
      },
      fontSize: {
        "headline-lg-mobile": ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "headline-sm": ["24px", { lineHeight: "1.4", fontWeight: "600" }],
        "label-md": ["12px", { lineHeight: "1.2", letterSpacing: "0.05em", fontWeight: "600" }],
        "headline-lg": ["48px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "headline-md": ["32px", { lineHeight: "1.3", fontWeight: "600" }]
      },
      spacing: {
        "component-gap": "16px",
        "container-padding": "32px",
        "unit": "8px",
        "gutter": "24px"
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
        "surface-tint": "#805062",
        "on-secondary": "#ffffff",
        "tertiary-fixed-dim": "#bdc2ff",
        "on-tertiary-fixed-variant": "#343d96",
        "inverse-primary": "#f2b6cb",
        "inverse-on-surface": "#f0f1f1",
        "secondary-fixed": "#d6e5ef",
        "primary": "#805062",
        "on-primary-fixed": "#330f1f",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#c4c8ff",
        "primary-fixed-dim": "#f2b6cb",
        "on-background": "#1a1c1c",
        "on-tertiary-fixed": "#000767",
        "on-primary": "#ffffff",
        "on-primary-fixed-variant": "#65394b",
        "secondary": "#526069",
        "surface-variant": "#e2e2e2",
        "surface-container": "#eeeeee",
        "primary-fixed": "#ffd9e4",
        "surface": "#f9f9f9",
        "on-primary-container": "#76485a",
        "secondary-container": "#d3e2ed",
        "primary-container": "#f8bbd0",
        "outline": "#827377",
        "surface-dim": "#dadada",
        "tertiary": "#4c56af",
        "secondary-fixed-dim": "#bac9d3",
        "on-surface-variant": "#504447",
        "on-secondary-fixed-variant": "#3b4951",
        "on-surface": "#1a1c1c",
        "error": "#ba1a1a",
        "surface-container-highest": "#e2e2e2",
        "surface-container-lowest": "#ffffff",
        "surface-bright": "#f9f9f9",
        "surface-container-low": "#f3f3f3",
        "on-error": "#ffffff",
        "on-secondary-fixed": "#0f1d25",
        "tertiary-fixed": "#e0e0ff",
        "on-tertiary-container": "#444da6",
        "on-secondary-container": "#56656e",
        "inverse-surface": "#2f3131",
        "error-container": "#ffdad6",
        "outline-variant": "#d4c2c6",
        "on-error-container": "#93000a",
        "background": "#f9f9f9",
        "surface-container-high": "#e8e8e8"
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
