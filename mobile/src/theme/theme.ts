import { DOODLIX_THEME } from '../shared/types';

export const COLORS = {
  primary: DOODLIX_THEME.colors.primaryPurple,
  primaryDark: DOODLIX_THEME.colors.primaryPurpleDark,
  primaryLight: DOODLIX_THEME.colors.primaryPurpleLight,
  lavender: DOODLIX_THEME.colors.lavender,
  lavenderMuted: DOODLIX_THEME.colors.lavenderMuted,
  softPink: DOODLIX_THEME.colors.softPink,
  softPinkLight: DOODLIX_THEME.colors.softPinkLight,
  background: DOODLIX_THEME.colors.background,
  surface: DOODLIX_THEME.colors.surface,
  surfaceElevated: DOODLIX_THEME.colors.surfaceElevated,
  text: DOODLIX_THEME.colors.textPrimary,
  textSecondary: DOODLIX_THEME.colors.textSecondary,
  textMuted: DOODLIX_THEME.colors.textMuted,
  border: DOODLIX_THEME.colors.border,
  borderStrong: DOODLIX_THEME.colors.borderStrong,
  success: DOODLIX_THEME.colors.success,
  warning: DOODLIX_THEME.colors.warning,
  error: DOODLIX_THEME.colors.error,
  white: '#FFFFFF',
  black: '#000000',
  palette: [
    '#7665E8', // Primary Purple
    '#24213A', // Deep Midnight
    '#FF6584', // Soft Coral Pink
    '#3B82F6', // Sky Blue
    '#10B981', // Mint Emerald
    '#F59E0B', // Amber Sunshine
    '#EC4899', // Berry Rose
    '#8B5CF6', // Vivid Violet
  ]
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#7665E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#7665E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#7665E8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
};

