import { motion, AnimatePresence } from 'framer-motion';

/**
 * SearchBar - Animated search input with icon
 * @component
 * @param {boolean} isOpen - Whether search bar is visible
 * @param {string} query - Current search query
 * @param {Function} onQueryChange - Callback for search input changes
 * @param {Function} onToggle - Callback to toggle search visibility
 */
const SearchBar = ({ isOpen, query, onQueryChange, onToggle }) => {
  const searchVariants = {
    hidden: { opacity: 0, width: 0 },
    visible: {
      opacity: 1,
      width: 'auto',
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      width: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  const handleToggle = () => {
    if (isOpen && query) {
      onQueryChange('');
    }
    onToggle();
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {isOpen && (
          <motion.input
            variants={searchVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="absolute right-0 px-3 py-2 pl-3 pr-10 text-sm bg-white/70 rounded-full border border-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
            autoFocus
            aria-label="Search products"
          />
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        className="p-2 hover:bg-white/50 rounded-full transition duration-300"
        aria-label={isOpen ? 'Close search' : 'Open search'}
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </motion.button>
    </div>
  );
};

export default SearchBar;
