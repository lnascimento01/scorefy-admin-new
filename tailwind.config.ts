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
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
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
        textMuted: 'var(--color-text-muted)',
        textPlaceholder: 'var(--color-text-placeholder)',
        textDisabled: 'var(--color-disabled)',
        disabled: 'var(--color-disabled)',
        borderSoft: 'var(--border-soft)',
        borderSofter: 'var(--border-softer)',
        borderStrong: 'var(--border-strong)',
        red: {
          primary: 'var(--color-danger)',
          hover: '#ff7484'
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
          bg: '#0B111A',
          surface: '#0F1724',
          surface2: '#121D2E',
          border: 'rgba(160, 190, 255, 0.10)',
          text: '#EAF1FF',
          subtitle: 'rgba(234,241,255,0.52)',
          textSecondary: 'rgba(234,241,255,0.72)',
          accent: '#4F8CFF',
          accentHover: '#3B78F2',
          red: {
            primary: '#FF5B6E',
            hover: '#ff7484'
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
        popover: 'var(--shadow-popover)',
        focus: 'var(--focus-ring)',
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
