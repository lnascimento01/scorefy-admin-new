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
        surface: {
          DEFAULT: 'var(--color-surface)',
          muted: 'var(--surface-muted)',
          elevated: 'var(--surface-elevated)'
        },
        onSurface: 'var(--color-on-surface)',
        textPrimary: 'var(--color-text-primary)',
        textSecondary: 'var(--color-text-secondary)',
        textPlaceholder: 'var(--color-text-placeholder)',
        disabled: 'var(--color-disabled)',
        borderSoft: 'var(--border-soft)',
        borderStrong: 'var(--border-strong)',
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
        card: '0 25px 60px var(--shadow-card)'
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
