import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../utils/constants';

/**
 * MobileMenu - Collapsible mobile navigation menu
 * @component
 * @param {boolean} isOpen - Whether menu is visible
 * @param {Function} onClose - Callback to close menu
 */
const MobileMenu = ({ isOpen, onClose }) => {
  const menuVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.nav
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="pb-4 border-t border-white/20"
        >
          <div className="flex flex-col gap-2">
            {CATEGORIES.map((category) => (
              <Link
                key={category.path}
                to={category.path}
                onClick={onClose}
                className="px-4 py-3 text-dark-700 hover:text-pink-500 hover:bg-white/30 rounded-lg font-medium transition duration-300"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
