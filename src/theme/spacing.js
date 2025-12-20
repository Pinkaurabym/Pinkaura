/**
 * 📐 Spacing System
 * Consistent spacing for padding, margins, gaps
 * Based on 8px grid system
 */

export const spacing = {
  // Base units (8px scale)
  0: '0px',
  1: '0.25rem',     // 4px
  2: '0.5rem',      // 8px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  32: '8rem',       // 128px

  // Named shortcuts
  xs: '0.5rem',     // 8px
  sm: '1rem',       // 16px
  md: '1.5rem',     // 24px
  lg: '2rem',       // 32px
  xl: '3rem',       // 48px
  '2xl': '4rem',    // 64px
  '3xl': '6rem',    // 96px
};

/**
 * Component padding presets
 */
export const padding = {
  // Buttons
  buttonSmall: spacing.sm,      // 16px
  buttonMedium: spacing.md,     // 24px
  buttonLarge: spacing.lg,      // 32px

  // Cards
  cardSmall: spacing.md,        // 24px
  cardMedium: spacing.lg,       // 32px
  cardLarge: spacing.xl,        // 48px

  // Sections
  sectionSmall: spacing.lg,     // 32px
  sectionMedium: spacing.xl,    // 48px
  sectionLarge: spacing['2xl'], // 64px
};

/**
 * Gap presets for flex/grid layouts
 */
export const gaps = {
  xs: spacing.xs,   // 8px
  sm: spacing.sm,   // 16px
  md: spacing.md,   // 24px
  lg: spacing.lg,   // 32px
  xl: spacing.xl,   // 48px
};

/**
 * Breakpoints for responsive design
 */
export const breakpoints = {
  xs: '0px',        // Mobile
  sm: '640px',      // Small devices
  md: '768px',      // Tablets
  lg: '1024px',     // Desktops
  xl: '1280px',     // Large screens
  '2xl': '1536px',  // Extra large
};

/**
 * Border radius presets
 */
export const borderRadius = {
  none: '0px',
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  '4xl': '2rem',    // 32px
  full: '9999px',   // Fully rounded
};

/**
 * Shadow presets
 */
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Custom glassy shadows
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
  glassLarge: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  
  // Glow effects
  glowPink: '0 0 20px rgba(238, 91, 143, 0.3)',
  glowPurple: '0 0 20px rgba(168, 85, 247, 0.3)',
};

/**
 * Z-index scale (avoid conflicts)
 */
export const zIndex = {
  auto: 'auto',
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  toast: 50,
  tooltip: 60,
};

/**
 * Transitions/Animations
 */
export const transitions = {
  // Duration
  duration: {
    instant: '0ms',
    fast: '150ms',
    base: '250ms',
    slow: '350ms',
    slower: '500ms',
  },

  // Easing functions
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },

  // Presets
  presets: {
    fast: {
      duration: '150ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    base: {
      duration: '250ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    slow: {
      duration: '350ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};
