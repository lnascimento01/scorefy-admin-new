export type ThemeName = 'light' | 'dark'

export const palette = {
  light: {
    primary: '#D22128',
    primaryHover: '#B71C21',
    secondary: '#8A8A8A',
    surface: '#F7F7F7',
    surfaceContrast: '#FFFFFF',
    border: '#E5E5E5',
    borderStrong: '#8A8A8A',
    text: '#0A0A0A',
    textMuted: '#525252',
    subtitle: '#8A8A8A'
  },
  dark: {
    primary: '#8E0E12',
    primaryHover: '#A01317',
    secondary: '#C7C7C7',
    surface: '#000000',
    surfaceContrast: '#111111',
    border: '#1E1E1E',
    borderStrong: '#2A2A2A',
    text: '#FFFFFF',
    textMuted: '#C7C7C7',
    subtitle: '#8A8A8A'
  }
}

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
  card: '0 10px 30px rgba(0, 0, 0, 0.06)',
  popover: '0 20px 50px rgba(0, 0, 0, 0.12)'
}

export const typography = {
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  baseSize: '16px'
}

export const semanticTokens = {
  light: {
    surfaceMuted: '#F0F0F0',
    surfaceRaised: '#FFFFFF'
  },
  dark: {
    surfaceMuted: '#1A1A1A',
    surfaceRaised: '#111111'
  }
}
