import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const ProductCard = ({ product, variant, onClick }) => {
  // Add defensive checks for undefined product or variant
  if (!product || !variant) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const imageVariants = {
    rest: {
      scale: 1,
      filter: 'brightness(1)',
    },
    hover: {
      scale: 1.08,
      filter: 'brightness(1.1)',
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  };

  const overlayVariants = {
    rest: { opacity: 0, y: 20 },
    hover: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  const badgeVariants = {
    hidden: { scale: 0, rotate: -45 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.5,
        delay: 0.3,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="product-card"
    >
      <Link to={`/product/${product.id}`} className="block h-full">
        {/* Image Container */}
        <div className="relative h-64 overflow-hidden bg-dark-100">
          <motion.img
            variants={imageVariants}
            initial="rest"
            whileHover="hover"
            src={variant?.images?.[0] || '/images/placeholder.png'}
            alt={product?.name || 'Product'}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />

          {/* Stock Badge */}
          {product.stock !== undefined && (
            <motion.div
              variants={badgeVariants}
              initial="hidden"
              animate="visible"
              className="absolute top-3 right-3 bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold"
            >
              Only {product.stock} left
            </motion.div>
          )}

          {/* Overlay with Quick Add Button */}
          <motion.div
            variants={overlayVariants}
            initial="rest"
            whileHover="hover"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary shadow-lg"
            >
              Quick View
            </motion.div>
          </motion.div>

        </div>

        {/* Info Container */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-dark-900 mb-1 line-clamp-2">
            {product.name}
          </h3>

          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-pink-500">
              ₹{product.price}
            </p>

          </div>

        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
