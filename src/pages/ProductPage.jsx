import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useProduct } from '../hooks/useProducts';
import useCartStore from '../store/cartStore';
import { NOTIFICATION_DURATION, FREE_SHIPPING_THRESHOLD } from '../utils/constants';

/**
 * ProductPage - Individual product detail view
 * @component
 * @description Displays product details, variant selection, and add to cart functionality
 */

const ProductPage = () => {
  const { id } = useParams();
  const product = useProduct(id);
  const { addToCart, cart } = useCartStore();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [notification, setNotification] = useState(null);

  // Set initial variant when product loads
  if (product && !selectedVariant) {
    setSelectedVariant(product.variants[0]);
  }

  /**
   * Calculate remaining stock for selected variant
   * @returns {number} Available stock minus items already in cart
   */
  const getRemainingStock = () => {
    if (!selectedVariant || !product) return 0;
    
    const cartItem = cart.find(
      (item) => item.id === product.id && item.color === selectedVariant.color
    );
    
    const quantityInCart = cartItem ? cartItem.quantity : 0;
    return selectedVariant.stock - quantityInCart;
  };

  const remainingStock = getRemainingStock();

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full"
        />
      </div>
    );
  }

  /**
   * Handle adding product to cart
   * Shows notification with special message when last item is added
   */
  const handleAddToBag = () => {
    if (selectedVariant && remainingStock > 0) {
      addToCart(product, selectedVariant);
      
      const newRemainingStock = remainingStock - 1;
      const message = newRemainingStock === 0 
        ? `${product.name} added! That's all we have in stock! 🎉`
        : `${product.name} added to bag! 🎉`;
      
      setNotification(message);
      setTimeout(() => setNotification(null), NOTIFICATION_DURATION.MEDIUM);
    }
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: 'easeOut', delay: 0.2 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 to-pink-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg"
        >
          {notification}
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Section */}
          <motion.div
            variants={imageVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4"
          >
            {/* Main Image */}
            <div className="w-full aspect-square overflow-hidden rounded-3xl bg-white shadow-xl">
              <motion.img
                key={selectedVariant?.images[0]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                src={selectedVariant?.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Gallery */}
            {selectedVariant && selectedVariant.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 lg:gap-3">
                {selectedVariant.images.map((img, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-pink-500 transition"
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Content Section */}
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col justify-start lg:pt-8"
          >
            {/* Title & Price */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-dark-900 mb-3">
              {product.name}
            </h1>
            <p className="text-3xl sm:text-4xl font-bold text-pink-500 mb-6">
              ₹{product.price}
            </p>

            {/* Description */}
            <p className="text-base sm:text-lg text-dark-700 mb-8 leading-relaxed">
              {product.description}
            </p>

            {/* Color Variants */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-dark-900 mb-4">
                Color: <span className="text-pink-500">{selectedVariant?.color}</span>
              </h3>
              <div className="flex gap-3 flex-wrap">
                {product.variants.map((variant) => (
                  <motion.button
                    key={variant.color}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedVariant(variant)}
                    className={`variant-pill ${
                      selectedVariant?.color === variant.color
                        ? 'active ring-2 ring-pink-500'
                        : ''
                    }`}
                    style={{
                      backgroundColor:
                        variant.color.toLowerCase() === 'gold'
                          ? '#FFD700'
                          : variant.color.toLowerCase(),
                      color: ['white', 'gold'].includes(
                        variant.color.toLowerCase()
                      )
                        ? '#000'
                        : '#fff',
                    }}
                  >
                    {variant.color}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Stock Info */}
            <div className="mb-6">
              {remainingStock > 0 ? (
                <p className="text-base sm:text-lg font-semibold text-mint-600">
                  ✓ {remainingStock} remaining in stock
                </p>
              ) : (
                <p className="text-base sm:text-lg font-semibold text-red-600">
                  {selectedVariant?.stock > 0 ? 'All items in your bag!' : 'Out of stock'}
                </p>
              )}
            </div>

            {/* Add to Bag Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToBag}
              disabled={remainingStock === 0}
              className={`btn-primary text-base sm:text-lg py-3 sm:py-4 px-6 sm:px-8 w-full sm:w-auto ${
                remainingStock === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {remainingStock > 0
                ? 'Add to Bag ✨'
                : selectedVariant?.stock > 0 
                  ? 'All in Bag'
                  : 'Out of Stock'}
            </motion.button>

            {/* Additional Info */}
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-dark-200">
              <div className="flex items-start gap-4">
                <span className="text-xl sm:text-2xl">🚚</span>
                <div>
                  <p className="font-semibold text-dark-900 text-sm sm:text-base">Free Shipping</p>
                  <p className="text-dark-600 text-xs sm:text-sm">On orders over ₹{FREE_SHIPPING_THRESHOLD}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
