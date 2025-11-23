import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './src/app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        onPrimary: 'var(--color-on-primary)',
        secondary: 'var(--color-secondary)',
        tertiary: 'var(--color-tertiary)',
        accent: 'var(--color-accent)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          contrast: 'var(--color-surface-contrast)',
          muted: 'var(--surface-muted)',
          elevated: 'var(--surface-elevated)',
          raised: 'var(--surface-elevated-strong)'
        },
        onSurface: 'var(--color-on-surface)',
        textPrimary: 'var(--color-text-primary)',
        textSecondary: 'var(--color-text-secondary)',
        textPlaceholder: 'var(--color-text-placeholder)',
        disabled: 'var(--color-disabled)',
        borderSoft: 'var(--border-soft)',
        borderStrong: 'var(--border-strong)',
        red: {
          primary: '#E52534',
          hover: '#FF3B46'
        },
        gray: {
          50: '#F7F7F7',
          100: '#E5E5E5',
          300: '#8A8A8A'
        },
        dark: {
          bg: '#0E0E0E',
          surface: '#1A1A1A',
          surface2: '#1F1F1F',
          border: '#2D2D2D',
          text: '#FFFFFF',
          subtitle: '#B3B3B3',
          red: {
            primary: '#E52534',
            hover: '#FF3B46'
          }
        },
        status: {
          live: '#10B981',
          paused: '#EAAA08',
          finished: '#EF4444',
          syncing: '#3B82F6'
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: 'var(--shadow-card)'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem'
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms'
      },
      transitionTimingFunction: {
        brand: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
  },
  plugins: []
}

export default config
