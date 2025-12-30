/**
 * Utility Functions - helpers.js
 * Common array, object, and string helpers
 */

/**
 * Group array by property
 * groupBy([{category: 'A', ...}, {category: 'B', ...}], 'category')
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Get unique values from array of objects
 */
export const getUnique = (array, key) => {
  return [...new Set(array.map((item) => item[key]))];
};

/**
 * Sort array by property
 */
export const sortBy = (array, key, order = 'asc') => {
  const sorted = [...array].sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
};

/**
 * Filter array by multiple conditions
 */
export const filterBy = (array, conditions) => {
  return array.filter((item) =>
    Object.entries(conditions).every(([key, value]) => {
      if (Array.isArray(value)) return value.includes(item[key]);
      return item[key] === value;
    })
  );
};

/**
 * Paginate array
 */
export const paginate = (array, page = 1, pageSize = 20) => {
  const start = (page - 1) * pageSize;
  return {
    items: array.slice(start, start + pageSize),
    total: array.length,
    pages: Math.ceil(array.length / pageSize),
    page,
  };
};

/**
 * Deep merge objects
 */
export const deepMerge = (target, source) => {
  const result = { ...target };
  Object.keys(source).forEach((key) => {
    if (source[key] && typeof source[key] === 'object') {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  });
  return result;
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Debounce function
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Make array unique
 */
export const unique = (array) => [...new Set(array)];

/**
 * Flatten array
 */
export const flatten = (array) => array.flat(Infinity);

/**
 * Chunk array into smaller arrays
 */
export const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};
