import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SHIPPING_COST, FREE_SHIPPING_THRESHOLD, STORAGE_KEYS } from '../utils/constants';

/**
 * Cart Store - Global state management for shopping cart
 * @module cartStore
 * @description Manages cart items, quantities, and calculations using Zustand
 */
const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      showCart: false,

      // Hydration state for SSR/persistence
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      /**
       * Add item to cart or increment quantity
       * @param {Object} product - Product object
       * @param {Object} variant - Selected variant (color, images, stock)
       * @returns {void}
       */
      addToCart: (product, variant) => {
        // Preserve full URLs (Cloudinary), otherwise ensure leading slash for local images
        const imagePath = variant.images[0].startsWith('http') 
          ? variant.images[0] 
          : (variant.images[0].startsWith('/') ? variant.images[0] : `/${variant.images[0]}`);
        
        const newItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          color: variant.color,
          quantity: 1,
          image: imagePath,
          stock: variant.stock,
        };

        set((state) => {
          const existingItem = state.cart.find(
            (item) => item.id === product.id && item.color === variant.color
          );

          if (existingItem) {
            // Increment quantity if stock allows
            if (existingItem.quantity < newItem.stock) {
              existingItem.quantity += 1;
              return { cart: [...state.cart] };
            }
            // Already at max stock
            return state;
          }

          // Add new item to cart
          return { cart: [...state.cart, newItem] };
        });
      },

      /**
       * Remove specific item from cart
       * @param {string|number} id - Product ID
       * @param {string} color - Variant color
       * @returns {void}
       */
      removeFromCart: (id, color) => {
        set((state) => ({
          cart: state.cart.filter(
            (item) => !(item.id === id && item.color === color)
          ),
        }));
      },

      /**
       * Update item quantity (removes if quantity <= 0)
       * @param {string|number} id - Product ID
       * @param {string} color - Variant color
       * @param {number} quantity - New quantity
       * @returns {void}
       */
      updateQuantity: (id, color, quantity) => {
        set((state) => {
          const cartItem = state.cart.find(
            (item) => item.id === id && item.color === color
          );
          
          if (!cartItem) return state;

          // Remove item if quantity is 0 or negative
          if (quantity <= 0) {
            return {
              cart: state.cart.filter(
                (item) => !(item.id === id && item.color === color)
              ),
            };
          }

          // Update quantity if within stock limit
          if (quantity <= cartItem.stock) {
            cartItem.quantity = quantity;
            return { cart: [...state.cart] };
          }

          // Quantity exceeds stock - don't update
          return state;
        });
      },

      /**
       * Clear entire cart
       * @returns {void}
       */
      clearCart: () => set({ cart: [] }),

      /**
       * Toggle cart drawer visibility
       * @returns {void}
       */
      toggleCart: () =>
        set((state) => ({ showCart: !state.showCart })),

      /**
       * Get total number of items in cart
       * @returns {number} Total quantity across all items
       */
      getCartCount: () => {
        return get().cart.reduce((totalCount, item) => totalCount + item.quantity, 0);
      },

      /**
       * Calculate cart totals
       * @returns {{ subtotal: number, shipping: number, total: number }}
       */
      getCartTotal: () => {
        const currentCart = get().cart;
        const subtotal = currentCart.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const shipping = currentCart.length > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_COST : 0;
        return { subtotal, shipping, total: subtotal + shipping };
      },
    }),
    {
      name: STORAGE_KEYS.CART,
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) {
          // Fix old image paths to include leading slash
          if (persistedState?.cart) {
            persistedState.cart = persistedState.cart.map(item => ({
              ...item,
              image: item.image?.startsWith('/') ? item.image : `/${item.image}`
            }));
          }
        }
        return persistedState;
      },
    }
  )
);

export default useCartStore;
