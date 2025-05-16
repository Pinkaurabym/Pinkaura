const bagApp = Vue.createApp({
  data() {
    return {
      products: [],
      cart: []
    };
  },
  computed: {
    // Build a richer cart-items array with name, price, color, quantity
    cartItems() {
      return this.cart.map(item => {
        const p = this.products.find(x => x.id === item.id) || {};
        return {
          id:       item.id,
          color:    item.color,
          name:     p.name,
          price:    p.price,
          quantity: item.quantity
        };
      });
    },
    // Sum up each line's price * quantity
    total() {
      return this.cartItems.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);
    }
  },
  methods: {
    // Lookup the correct image for a given product id + color
    getImage(id, color) {
      const prod = this.products.find(p => p.id === id);
      if (!prod) return "";
      const variant = prod.variants.find(v => v.color === color);
      return variant
        ? variant.images[0]
        : prod.variants[0].images[0];
    },

    loadCart() {
      this.cart = JSON.parse(localStorage.getItem("cart") || "[]");
    },
    saveCart() {
      localStorage.setItem("cart", JSON.stringify(this.cart));
    },

    increment(id, color) {
      const it = this.cart.find(i => i.id === id && i.color === color);
      if (it) {
        it.quantity++;
        this.saveCart();
      }
    },
    decrement(id, color) {
      const it = this.cart.find(i => i.id === id && i.color === color);
      if (!it) return;
      if (it.quantity > 1) {
        it.quantity--;
      } else {
        this.cart = this.cart.filter(i => !(i.id === id && i.color === color));
      }
      this.saveCart();
    },
    remove(id, color) {
      this.cart = this.cart.filter(i => !(i.id === id && i.color === color));
      this.saveCart();
    },

    goToCheckout() {
      window.location.href = "checkout.html";
    }
  },
  mounted() {
    // 1) load full product list
    fetch("data/products.json")
      .then(r => r.json())
      .then(data => {
        this.products = data;
      })
      .catch(err => console.error("Failed to load products:", err));

    // 2) restore cart from localStorage
    this.loadCart();
  }
});

bagApp.mount("#app");
