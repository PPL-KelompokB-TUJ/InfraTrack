/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
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
        /* Material Design 3 token colors — all via CSS variables for dark mode support */
        'surface':                    'var(--color-surface)',
        'surface-dim':                'var(--color-surface-dim)',
        'surface-bright':             'var(--color-surface-bright)',
        'surface-container-lowest':   'var(--color-surface-container-lowest)',
        'surface-container-low':      'var(--color-surface-container-low)',
        'surface-container':          'var(--color-surface-container)',
        'surface-container-high':     'var(--color-surface-container-high)',
        'surface-container-highest':  'var(--color-surface-container-highest)',
        'on-surface':                 'var(--color-on-surface)',
        'on-surface-variant':         'var(--color-on-surface-variant)',
        'inverse-surface':            'var(--color-inverse-surface)',
        'inverse-on-surface':         'var(--color-inverse-on-surface)',
        'outline':                    'var(--color-outline)',
        'outline-variant':            'var(--color-outline-variant)',
        'surface-tint':               'var(--color-surface-tint)',
        'primary':                    'var(--color-primary)',
        'on-primary':                 'var(--color-on-primary)',
        'primary-container':          'var(--color-primary-container)',
        'on-primary-container':       'var(--color-on-primary-container)',
        'inverse-primary':            'var(--color-inverse-primary)',
        'secondary':                  'var(--color-secondary)',
        'on-secondary':               'var(--color-on-secondary)',
        'secondary-container':        'var(--color-secondary-container)',
        'on-secondary-container':     'var(--color-on-secondary-container)',
        'tertiary':                   'var(--color-tertiary)',
        'on-tertiary':                'var(--color-on-tertiary)',
        'tertiary-container':         'var(--color-tertiary-container)',
        'on-tertiary-container':      'var(--color-on-tertiary-container)',
        'error':                      'var(--color-error)',
        'on-error':                   'var(--color-on-error)',
        'error-container':            'var(--color-error-container)',
        'on-error-container':         'var(--color-on-error-container)',
        'primary-fixed':              '#b7eaff',
        'primary-fixed-dim':          '#6cd3f7',
        'on-primary-fixed':           '#001f28',
        'on-primary-fixed-variant':   '#004e61',
        'secondary-fixed':            '#89f5e7',
        'secondary-fixed-dim':        '#6bd8cb',
        'on-secondary-fixed':         '#00201d',
        'on-secondary-fixed-variant': '#005049',
        'tertiary-fixed':             '#e1e0ff',
        'tertiary-fixed-dim':         '#c0c1ff',
        'on-tertiary-fixed':          '#07006c',
        'on-tertiary-fixed-variant':  '#2f2ebe',
        'background':                 'var(--color-background)',
        'on-background':              'var(--color-on-background)',
        'surface-variant':            'var(--color-surface-variant)',
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
