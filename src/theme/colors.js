/**
 * 🎨 Pinkaura Color Palette
 * Single source of truth for all colors in the application
 * Never hardcode colors in components - use these constants instead
 */

export const colors = {
  // Primary Brand Colors
  primary: {
    pink: '#EE5B8F',        // Main brand pink
    pinkLight: '#F285B0',   // Lighter pink
    pinkDark: '#D12E5A',    // Darker pink
    aura: '#FFB6D9',        // Light "aura" pink (accents)
  },

  // Secondary Colors (Complementary)
  secondary: {
    purple: '#A855F7',      // Main purple
    purpleLight: '#C084FC', // Lighter purple
    purpleDark: '#7E22CE',  // Darker purple
    lavender: '#E6D9F5',    // Light lavender (backgrounds)
  },

  // Accent Colors
  accent: {
    mint: '#0FE5A8',        // Main mint (success, highlights)
    mintLight: '#6FFFC4',   // Lighter mint
    gold: '#FFD700',        // Gold variant color
  },

  // Neutral/Grayscale
  neutral: {
    dark900: '#212121',     // Near black
    dark800: '#424242',     // Very dark gray
    dark700: '#616161',     // Dark gray
    dark600: '#757575',     // Gray
    dark500: '#9E9E9E',     // Medium gray
    dark400: '#BDBDBD',     // Light gray
    dark300: '#E0E0E0',     // Lighter gray
    dark200: '#EEEEEE',     // Very light gray
    dark100: '#F5F5F5',     // Almost white
    dark50: '#FAFAFA',      // Off white (background)
    white: '#FFFFFF',       // Pure white
  },

  // Semantic Colors
  semantic: {
    success: '#0FE5A8',     // Success states
    error: '#EF4444',       // Error states
    warning: '#F59E0B',     // Warning states
    info: '#3B82F6',        // Info states
  },

  // Gradients (CSS strings)
  gradients: {
    aura: 'linear-gradient(135deg, #FFB6D9 0%, #E6D9F5 100%)',
    mint: 'linear-gradient(135deg, #0FE5A8 0%, #6FFFC4 100%)',
    gold: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    dark: 'linear-gradient(135deg, #212121 0%, #424242 100%)',
    glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
  },
};

/**
 * Get color value by path
 * Usage: getColor('primary.pink') → '#EE5B8F'
 */
export const getColor = (path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], colors);
};

/**
 * CSS Variables for easy access in stylesheets
 * Can be used with var(--color-primary-pink) in CSS
 */
export const getCSSVariables = () => {
  const vars = {};
  
  const flattenColors = (obj, prefix = '') => {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && !value.includes?.('(')) {
        flattenColors(value, `${prefix}${prefix ? '-' : ''}${key}`);
      } else {
        vars[`--color${prefix ? '-' : ''}${prefix}-${key}`] = value;
      }
    });
  };

  flattenColors(colors);
  return vars;
};
