/**
 * Utility Functions - formatters.js
 * Price, date, text formatting
 */

/**
 * Format price to INR
 * formatPrice(1500) → "₹1,500"
 */
export const formatPrice = (price) => {
  return `₹${price.toLocaleString('en-IN')}`;
};

/**
 * Format currency without symbol
 */
export const formatCurrency = (amount) => {
  return amount.toLocaleString('en-IN');
};

/**
 * Calculate discount percentage
 */
export const getDiscountPercent = (originalPrice, salePrice) => {
  if (!originalPrice || !salePrice || originalPrice <= salePrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

/**
 * Format date to readable string
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, length = 50) => {
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Format product name (remove extra spaces, fix casing)
 */
export const formatProductName = (name) => {
  return name
    .trim()
    .split(' ')
    .map((word) => capitalize(word.toLowerCase()))
    .join(' ');
};
