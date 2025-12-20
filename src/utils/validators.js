/**
 * 🛠️ Utility Functions - validators.js
 * Form validation and data validation
 */

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate phone number (India)
 */
export const isValidPhone = (phone) => {
  return /^[6-9]\d{9}$/.test(phone?.replace(/\D/g, ''));
};

/**
 * Validate PIN code
 */
export const isValidPinCode = (pin) => {
  return /^[1-9]\d{5}$/.test(pin);
};

/**
 * Validate quantity
 */
export const isValidQuantity = (quantity, max = Infinity) => {
  return Number.isInteger(quantity) && quantity > 0 && quantity <= max;
};

/**
 * Validate price
 */
export const isValidPrice = (price) => {
  return typeof price === 'number' && price > 0;
};

/**
 * Validate product data
 */
export const isValidProduct = (product) => {
  return (
    product?.id &&
    product?.name &&
    product?.price &&
    product?.category &&
    Array.isArray(product?.variants) &&
    product.variants.length > 0
  );
};

/**
 * Validate cart item
 */
export const isValidCartItem = (item) => {
  return (
    item?.id &&
    item?.name &&
    item?.price > 0 &&
    item?.quantity > 0 &&
    item?.color
  );
};

/**
 * Validate form field
 */
export const validateField = (name, value) => {
  const validations = {
    email: isValidEmail,
    phone: isValidPhone,
    pinCode: isValidPinCode,
    quantity: (val) => isValidQuantity(val),
  };

  return validations[name]?.(value) ?? true;
};
