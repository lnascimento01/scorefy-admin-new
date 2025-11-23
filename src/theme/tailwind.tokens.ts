export type ThemeName = 'light' | 'dark'

export const theme = {
  light: {
    bg: '#F6F6F7',
    card: '#FFFFFF',
    border: '#E5E5E7',
    text: '#0A0A0A',
    textSecondary: '#6E6E73',
    accent: '#007AFF',
    accentHover: '#0A84FF'
  },
  dark: {
    bg: '#0D0D0D',
    card: '#1C1C1E',
    elevated: '#2C2C2E',
    border: '#3A3A3C',
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    accent: '#0A84FF',
    accentHover: '#409CFF'
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
    borderStrong: '#515156',
    text: theme.dark.text,
    textMuted: theme.dark.textSecondary,
    subtitle: theme.dark.textSecondary
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
  card: '0 2px 12px rgba(0, 0, 0, 0.08)',
  popover: '0 12px 36px rgba(0, 0, 0, 0.12)'
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
    surfaceMuted: theme.dark.card,
    surfaceRaised: theme.dark.card,
    surfaceElevated: theme.dark.elevated
  }
}
