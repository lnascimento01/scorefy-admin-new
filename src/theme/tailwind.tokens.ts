export type ThemeName = 'light' | 'dark'

export const theme = {
  light: {
    bg: '#EEF2F8',
    card: '#FFFFFF',
    elevated: '#F7F9FC',
    border: 'rgba(15, 23, 42, 0.10)',
    text: '#0F172A',
    textSecondary: 'rgba(15, 23, 42, 0.74)',
    accent: '#2563EB',
    accentHover: '#1D4ED8'
  },
  dark: {
    bg: '#0B111A',
    card: '#0F1724',
    elevated: '#121D2E',
    raised: '#16243A',
    border: 'rgba(160, 190, 255, 0.10)',
    text: '#EAF1FF',
    textSecondary: 'rgba(234, 241, 255, 0.72)',
    accent: '#4F8CFF',
    accentHover: '#3B78F2'
  }
} satisfies Record<ThemeName, Record<string, string>>

export const palette = {
  light: {
    primary: theme.light.accent,
    primaryHover: theme.light.accentHover,
    secondary: theme.light.textSecondary,
    surface: theme.light.bg,
    surfaceContrast: theme.light.card,
    surfaceElevated: theme.light.card,
    border: theme.light.border,
    borderStrong: '#C7C7CC',
    text: theme.light.text,
    textMuted: theme.light.textSecondary,
    subtitle: theme.light.textSecondary
  },
  dark: {
    primary: theme.dark.accent,
    primaryHover: theme.dark.accentHover,
    secondary: theme.dark.textSecondary,
    surface: theme.dark.bg,
    surfaceContrast: theme.dark.card,
    surfaceElevated: theme.dark.elevated,
    border: theme.dark.border,
    borderStrong: 'rgba(160, 190, 255, 0.18)',
    text: theme.dark.text,
    textMuted: theme.dark.textSecondary,
    subtitle: 'rgba(234, 241, 255, 0.52)'
  }
} satisfies Record<ThemeName, Record<string, string>>

export const radii = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem'
}

export const spacing = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem'
}

export const shadows = {
  card: '0 1px 0 rgba(255,255,255,0.04), 0 10px 24px rgba(0,0,0,0.35)',
  popover: '0 1px 0 rgba(255,255,255,0.06), 0 18px 40px rgba(0,0,0,0.55)'
}

export const typography = {
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  baseSize: '16px'
}

export const semanticTokens = {
  light: {
    surfaceMuted: '#EFEFF1',
    surfaceRaised: theme.light.card,
    surfaceElevated: theme.light.card
  },
  dark: {
    surfaceMuted: theme.dark.elevated,
    surfaceRaised: theme.dark.raised,
    surfaceElevated: theme.dark.elevated
  }
}
