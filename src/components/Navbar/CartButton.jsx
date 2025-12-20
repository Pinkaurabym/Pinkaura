import { motion } from 'framer-motion';
import { UI_CONFIG } from '../../utils/constants';

/**
 * CartButton - Shopping cart icon with item count badge
 * @component
 * @param {number} itemCount - Number of items in cart
 * @param {Function} onClick - Callback when clicked
 */
const CartButton = ({ itemCount, onClick }) => {
  const displayCount = itemCount > UI_CONFIG.MAX_CART_ITEMS_DISPLAY 
    ? `${UI_CONFIG.MAX_CART_ITEMS_DISPLAY}+` 
    : itemCount;

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative p-2 hover:bg-white/50 rounded-full transition duration-300"
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <svg
        className="w-6 h-6 text-dark-900"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      {itemCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
        >
          {displayCount}
        </motion.span>
      )}
    </motion.button>
  );
};

export default CartButton;
