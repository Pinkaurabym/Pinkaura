/**
 * 🎨 Theme Index
 * Export all design tokens from one place
 * Components import from here: import { colors, spacing } from '@/theme'
 */

export { colors, getColor, getCSSVariables } from './colors';
export { typography, useTypography } from './typography';
export {
  spacing,
  padding,
  gaps,
  breakpoints,
  borderRadius,
  shadows,
  zIndex,
  transitions,
} from './spacing';

/**
 * Complete theme object
 * Useful for passing to styled-components or theme providers
 */
export const theme = {
  colors: require('./colors').colors,
  typography: require('./typography').typography,
  spacing: require('./spacing').spacing,
  padding: require('./spacing').padding,
  gaps: require('./spacing').gaps,
  breakpoints: require('./spacing').breakpoints,
  borderRadius: require('./spacing').borderRadius,
  shadows: require('./spacing').shadows,
  zIndex: require('./spacing').zIndex,
  transitions: require('./spacing').transitions,
};

export default theme;
