/**
 * Utility Functions - constants.js
 * Enums, hardcoded values, configuration
 */

export const SORT_OPTIONS = {
  RECENT: 'recent',
  PRICE_ASC: 'priceAsc',
  PRICE_DESC: 'priceDesc',
  TRENDING: 'trending',
  BESTSELLER: 'bestseller',
};

export const SORT_LABELS = {
  recent: 'Recent',
  priceAsc: 'Price: Low to High',
  priceDesc: 'Price: High to Low',
  trending: 'Trending',
  bestseller: 'Best Sellers',
};

export const FILTER_TYPES = {
  CATEGORY: 'category',
  PRICE: 'price',
  TRENDING: 'trending',
  BESTSELLER: 'bestseller',
};

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

export const NOTIFICATION_DURATION = {
  SHORT: 2000,
  MEDIUM: 3000,
  LONG: 5000,
  PERSISTENT: 0,
};

export const CART_ACTIONS = {
  ADD: 'add',
  REMOVE: 'remove',
  UPDATE: 'update',
  CLEAR: 'clear',
};

export const PRODUCT_STATUS = {
  AVAILABLE: 'available',
  LOW_STOCK: 'lowStock',
  OUT_OF_STOCK: 'outOfStock',
};

export const COLORS = {
  PRIMARY_PINK: '#EE5B8F',
  SECONDARY_PURPLE: '#A855F7',
  ACCENT_MINT: '#0FE5A8',
  NEUTRAL_DARK: '#212121',
};

/**
 * Pricing & Shipping Configuration
 */
export const SHIPPING_COST = 60;
export const FREE_SHIPPING_THRESHOLD = 999;
export const TAX_RATE = 0; // 0% tax for now

export const STORAGE_KEYS = {
  CART: 'cart',
  PRODUCTS: 'products',
  USER_PREFERENCES: 'userPreferences',
  RECENT_SEARCHES: 'recentSearches',
};

export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT: '/product/:id',
  TRENDING: '/trending',
  BESTSELLERS: '/bestsellers',
  BAG: '/bag',
  CHECKOUT: '/checkout',
  ADMIN: '/admin',
  ORDER_SUCCESS: '/order-success',
  SEARCH: '/search',
};

export const ANIMATION_DURATION = {
  FAST: 150,
  BASE: 250,
  SLOW: 350,
};

export const PAGE_SIZE = 20; // Products per page

/**
 * Navigation Categories
 */
export const CATEGORIES = [
  { name: 'Home', path: '/' },
  { name: 'Rings', path: '/products?category=Rings' },
  { name: 'Necklaces', path: '/products?category=Necklaces' },
  { name: 'Earrings', path: '/products?category=Earrings' },
  { name: 'Bracelets', path: '/products?category=Bracelets' },
  { name: 'Trending', path: '/products?category=trending' },
  { name: 'Best Sellers', path: '/products?category=bestSeller' },
  { name: 'All Products', path: '/products' },
];

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  NAVBAR_HEIGHT: 80, // px
  MOBILE_BREAKPOINT: 768, // px
  MAX_CART_ITEMS_DISPLAY: 99,
  THUMBNAIL_GRID_COLUMNS: 4,
};
