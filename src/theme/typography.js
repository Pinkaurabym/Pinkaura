/**
 * 📝 Typography Configuration
 * Font families, sizes, weights, line heights
 */

export const typography = {
  // Font Families
  fonts: {
    heading: "'Playfair Display', serif",
    body: "'Poppins', sans-serif",
  },

  // Font Sizes (in rem, relative to 16px base)
  sizes: {
    xs: '0.75rem',      // 12px - Labels, small text
    sm: '0.875rem',     // 14px - Small text
    base: '1rem',       // 16px - Body text
    lg: '1.125rem',     // 18px - Large body
    xl: '1.25rem',      // 20px - Large
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px - Section headers
    '4xl': '2.25rem',   // 36px - Page titles
    '5xl': '3rem',      // 48px - Hero titles
    '6xl': '3.75rem',   // 60px - Large hero
  },

  // Font Weights
  weights: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Preset text styles (combine size + weight + line-height)
  presets: {
    // Headings
    h1: {
      fontSize: '3.75rem',   // 60px
      fontWeight: 700,
      lineHeight: 1.2,
      fontFamily: "'Playfair Display', serif",
    },
    h2: {
      fontSize: '3rem',      // 48px
      fontWeight: 700,
      lineHeight: 1.2,
      fontFamily: "'Playfair Display', serif",
    },
    h3: {
      fontSize: '1.875rem',  // 30px
      fontWeight: 600,
      lineHeight: 1.3,
      fontFamily: "'Playfair Display', serif",
    },
    h4: {
      fontSize: '1.5rem',    // 24px
      fontWeight: 600,
      lineHeight: 1.4,
      fontFamily: "'Playfair Display', serif",
    },

    // Body text
    body: {
      fontSize: '1rem',      // 16px
      fontWeight: 400,
      lineHeight: 1.5,
      fontFamily: "'Poppins', sans-serif",
    },
    bodySmall: {
      fontSize: '0.875rem',  // 14px
      fontWeight: 400,
      lineHeight: 1.5,
      fontFamily: "'Poppins', sans-serif",
    },

    // Button text
    button: {
      fontSize: '1rem',      // 16px
      fontWeight: 600,
      lineHeight: 1.2,
      fontFamily: "'Poppins', sans-serif",
      textTransform: 'none',
    },

    // Label text
    label: {
      fontSize: '0.875rem',  // 14px
      fontWeight: 600,
      lineHeight: 1.4,
      fontFamily: "'Poppins', sans-serif",
    },

    // Caption text
    caption: {
      fontSize: '0.75rem',   // 12px
      fontWeight: 400,
      lineHeight: 1.4,
      fontFamily: "'Poppins', sans-serif",
    },
  },
};

/**
 * Apply preset styles to any element
 * Usage: const styles = useTypography('h1')
 */
export const useTypography = (presetName) => {
  return typography.presets[presetName] || typography.presets.body;
};
