// Design tokens for the Hotel Check-In mobile app
// Dark glassmorphism theme matching the desktop app

export const Colors = {
  // Base
  bgBase:      '#0a0a0f',
  bgSurface:   '#111118',
  bgElevated:  '#18181f',
  bgGlass:     'rgba(255,255,255,0.04)',
  bgGlassHover:'rgba(255,255,255,0.08)',

  // Borders
  border:      'rgba(255,255,255,0.09)',
  borderStrong:'rgba(255,255,255,0.16)',

  // Text
  textPrimary:   '#f0f0f8',
  textSecondary: '#8b8ba8',
  textMuted:     '#4a4a65',

  // Accent
  accent:      '#6c63ff',
  accentGlow:  'rgba(108,99,255,0.28)',
  accentDim:   'rgba(108,99,255,0.14)',

  // Status
  green:       '#22d09a',
  greenDim:    'rgba(34,208,154,0.14)',
  red:         '#ff5e7d',
  redDim:      'rgba(255,94,125,0.14)',
  amber:       '#ffb347',
  amberDim:    'rgba(255,179,71,0.14)',
  blue:        '#4fa3ff',
  blueDim:     'rgba(79,163,255,0.14)',
}

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
}

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
}

export const FontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  xxl:  30,
}

export const FontWeight = {
  regular: '400' as const,
  medium:  '500' as const,
  semibold:'600' as const,
  bold:    '700' as const,
  heavy:   '800' as const,
}
