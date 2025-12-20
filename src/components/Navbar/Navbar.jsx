import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import useCartStore from '../../store/cartStore';
import MobileMenu from './MobileMenu';
import SearchBar from './SearchBar';
import CartButton from './CartButton';

/**
 * Navbar - Main navigation header
 * @component
 * @description Fixed header with logo, navigation menu, search, and cart
 */
const Navbar = () => {
  const { cart, toggleCart } = useCartStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cartCount = cart.reduce((totalItems, item) => totalItems + item.quantity, 0);

  const containerVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  const handleMenuToggle = () => setIsMenuOpen(!isMenuOpen);
  const handleSearchToggle = () => setSearchOpen(!searchOpen);

  return (
    <motion.header
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ backgroundColor: '#f9e8ee' }}
      className="fixed top-0 left-0 right-0 w-full z-40 backdrop-blur-sm border-b border-white/20 bg-brand-bg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-4">
          {/* Left: Hamburger Menu */}
          <div className="flex items-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleMenuToggle}
              className="p-2 hover:bg-white/50 rounded-full transition duration-300"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
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
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </motion.button>
          </div>

          {/* Center: Logo */}
          <Link
            to="/"
            className="flex-1 flex justify-center items-center group"
          >
            <motion.img
              whileHover={{ scale: 1.05 }}
              src="/images/logo.png"
              alt="Pinkaura"
              className="h-20 w-auto object-contain drop-shadow-sm"
            />
          </Link>

          {/* Right: Search and Cart */}
          <div className="flex items-center gap-2">
            <SearchBar
              isOpen={searchOpen}
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onToggle={handleSearchToggle}
            />
            <CartButton itemCount={cartCount} onClick={toggleCart} />
          </div>
        </div>

        {/* Mobile Menu */}
        <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      </div>
    </motion.header>
  );
};

export default Navbar;
