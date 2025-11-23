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
        light: {
          bg: '#F6F6F7',
          card: '#FFFFFF',
          border: '#E5E5E7',
          text: '#0A0A0A',
          textSecondary: '#6E6E73',
          accent: '#007AFF',
          accentHover: '#0A84FF'
        },
        gray: {
          50: '#F6F6F7',
          100: '#E5E5E7',
          300: '#8E8E93'
        },
        dark: {
          bg: '#0D0D0D',
          surface: '#1C1C1E',
          surface2: '#2C2C2E',
          border: '#3A3A3C',
          text: '#FFFFFF',
          subtitle: '#B3B3B3',
          textSecondary: '#B3B3B3',
          accent: '#0A84FF',
          accentHover: '#409CFF',
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
        card: 'var(--shadow-card)',
        apple: '0 2px 12px rgba(0,0,0,0.08)'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        apple: '12px'
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
