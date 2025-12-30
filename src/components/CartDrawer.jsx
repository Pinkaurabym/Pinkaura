import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import useCartStore from '../store/cartStore';
import { NOTIFICATION_DURATION } from '../utils/constants';

/**
 * CartDrawer - Side drawer showing cart items
 * @component
 * @description Slide-in cart panel with item management and checkout button
 */

const CartDrawer = () => {
  const { cart, showCart, toggleCart, removeFromCart, updateQuantity, getCartTotal } = useCartStore();
  const { total, shipping } = getCartTotal();
  const subtotal = total - shipping;
  const [stockMessage, setStockMessage] = useState(null);

  /**
   * Handle quantity update with stock validation
   * @param {string|number} id - Product ID
   * @param {number} variantNumber - Variant number
   * @param {number} newQuantity - Requested quantity
   * @param {number} stock - Available stock
   */
  const handleQuantityUpdate = (id, variantNumber, newQuantity, stock) => {
    const cartItem = cart.find(item => item.id === id && item.variantNumber === variantNumber);
    if (newQuantity > stock) {
      setStockMessage(`Only ${stock} item${stock > 1 ? 's' : ''} available in stock`);
      setTimeout(() => setStockMessage(null), NOTIFICATION_DURATION.MEDIUM);
      return;
    }
    updateQuantity(id, variantNumber, newQuantity);
  };

  const drawerVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
    exit: {
      x: '100%',
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeIn' },
    },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <AnimatePresence>
      {showCart && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={toggleCart}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl overflow-y-auto"
          >
            {/* Stock Message Notification */}
            <AnimatePresence>
              {stockMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-4 left-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-semibold z-10"
                >
                  {stockMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-dark-100 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-heading font-bold">My Cart</h2>
                <button
                  onClick={toggleCart}
                  className="text-2xl text-dark-600 hover:text-dark-900 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="p-6">
              {cart.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-dark-500 mb-4">Your cart is empty</p>
                  <Link
                    to="/"
                    onClick={toggleCart}
                    className="btn-primary inline-block"
                  >
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                <>
                  {/* Items */}
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <motion.div
                        key={`${item.id}-${item.variantNumber}`}
                        layout
                        className="flex gap-4 pb-4 border-b border-dark-100"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-dark-900">
                            {item.name}
                          </h3>
                          <p className="text-sm text-dark-600">
                            Variant #{item.variantNumber}
                          </p>
                          <p className="text-pink-500 font-bold">
                            ₹{item.price}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.variantNumber,
                                  item.quantity - 1
                                )
                              }
                              className="w-6 h-6 rounded bg-dark-100 hover:bg-dark-200 text-dark-900 flex items-center justify-center"
                            >
                              −
                            </button>
                            <span className="w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleQuantityUpdate(
                                  item.id,
                                  item.variantNumber,
                                  item.quantity + 1,
                                  item.stock
                                )
                              }
                              className="w-6 h-6 rounded bg-dark-100 hover:bg-dark-200 text-dark-900 flex items-center justify-center"
                            >
                              +
                            </button>
                            <span className="text-xs text-dark-500 ml-1">({item.stock} max)</span>
                            <button
                              onClick={() =>
                                removeFromCart(item.id, item.variantNumber)
                              }
                              className="ml-auto text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Footer Summary */}
                  <div className="border-t border-dark-100 pt-4 space-y-2">
                    <div className="flex justify-between text-dark-600">
                      <span>Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-dark-600">
                      <span>Shipping</span>
                      <span>₹{shipping}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-dark-900 pt-2">
                      <span>Total</span>
                      <span>₹{total}</span>
                    </div>
                    <Link
                      to="/checkout"
                      onClick={toggleCart}
                      className="btn-primary w-full text-center block mt-4"
                    >
                      Checkout
                    </Link>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
