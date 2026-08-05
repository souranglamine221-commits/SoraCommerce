// src/styles/designSystem.js
// SoraCommerce Global Design System

export const colors = {
  primary: '#0B1F3A',
  gold: '#D4AF37',
  white: '#FFFFFF',
  gray: '#F5F7FA',
  
  // Extended palette
  primaryDark: '#07152A',
  primaryLight: '#1A3A5C',
  goldLight: '#E4C157',
  goldDark: '#B8942F',
  grayDark: '#E2E8F0',
  grayDarker: '#CBD5E1',
  text: '#1E293B',
  textLight: '#64748B',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    heading: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
};

export const buttons = {
  primary: {
    backgroundColor: colors.primary,
    color: colors.white,
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: '0.5rem',
    fontWeight: typography.fontWeight.medium,
    transition: 'all 0.2s ease',
    hover: {
      backgroundColor: colors.primaryDark,
    },
  },
  
  secondary: {
    backgroundColor: colors.gold,
    color: colors.primary,
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: '0.5rem',
    fontWeight: typography.fontWeight.medium,
    transition: 'all 0.2s ease',
    hover: {
      backgroundColor: colors.goldLight,
    },
  },
  
  outline: {
    backgroundColor: 'transparent',
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: '0.5rem',
    fontWeight: typography.fontWeight.medium,
    transition: 'all 0.2s ease',
    hover: {
      backgroundColor: colors.primary,
      color: colors.white,
    },
  },
  
  ghost: {
    backgroundColor: 'transparent',
    color: colors.text,
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: '0.5rem',
    fontWeight: typography.fontWeight.medium,
    transition: 'all 0.2s ease',
    hover: {
      backgroundColor: colors.gray,
    },
  },
};

export const cards = {
  base: {
    backgroundColor: colors.white,
    borderRadius: '0.75rem',
    padding: spacing.lg,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  
  elevated: {
    backgroundColor: colors.white,
    borderRadius: '0.75rem',
    padding: spacing.lg,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  
  outlined: {
    backgroundColor: colors.white,
    borderRadius: '0.75rem',
    padding: spacing.lg,
    border: `1px solid ${colors.grayDarker}`,
    boxShadow: 'none',
  },
};

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  base: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  full: '9999px',
};

export const transitions = {
  fast: '150ms ease',
  base: '200ms ease',
  slow: '300ms ease',
};

export const designSystem = {
  colors,
  typography,
  spacing,
  buttons,
  cards,
  shadows,
  borderRadius,
  transitions,
};

export default designSystem;
