const productApp = Vue.createApp({
  data() {
    return {
      product: null, selectedVariant: null, cart: [],
      showModal: false,
      modalTitle: "",
      modalMessage: "",
      modalType: "" // "limit" for out-of-stock, "success" for added
    };
  },

  computed: {
    images() { return this.selectedVariant ? this.selectedVariant.images : []; },
    cartCount() { return this.cart.reduce((s, i) => s + i.quantity, 0); },
    selectedStock() {
      const s = Number(this.selectedVariant?.stock);
      return Number.isFinite(s) ? s : 0;
    }
  },

  methods: {
    // Goes back in history (if you were using a Back button)
    goBack() {
      history.back();
    },

    // Load the cart array from localStorage
    loadCart() {
      this.cart = JSON.parse(localStorage.getItem("cart") || "[]");
    },

    // Persist the cart array back to localStorage
    saveCart() {
      localStorage.setItem("cart", JSON.stringify(this.cart));
    },

    goToBag() { this.showModal = false; window.location.href = "bag.html"; },

    // Add current product + variant (color) to the bag
    addToBag() {
      const stock = this.selectedStock;
      const color = this.selectedVariant.color;

      const existing = this.cart.find(i => i.id === this.product.id && i.color === color);
      const existingQty = existing ? existing.quantity : 0;

      if (existingQty >= stock) {
        this.modalTitle = "Can’t add more";
        this.modalMessage = `${existingQty} items already in bag (only ${stock} left)`;
        this.modalType = "limit";
        this.showModal = true;
        return;
      }

      if (existing) existing.quantity++;
      else this.cart.push({ id: this.product.id, color, quantity: 1 });
      this.saveCart();

      // Show success modal
      this.modalTitle = "Added to Bag";
      this.modalMessage = `${this.product.name} (${color}) has been added to your bag.`;
      this.modalType = "success";
      this.showModal = true;
      if (this.modalType === "success") {
        setTimeout(() => { this.showModal = false; }, 1800);
      }

    },
    // Switch the displayed variant (and thus the image)
    selectVariant(v) {
      this.selectedVariant = v;
    },

    // Fetch the JSON, find the product by ?id=, and set initial variant
    fetchProduct() {
      const params = new URLSearchParams(window.location.search);
      const id = Number(params.get("id"));

      fetch("data/products.json")
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then(data => {
          this.product = data.find(p => p.id === id);
          // default to the first variant
          this.selectedVariant = this.product.variants[0];
        })
        .catch(err => {
          console.error("Could not load product data:", err);
        });
    }
  },
  mounted() {
    // On load, restore the bag and then load the product
    this.loadCart();
    this.fetchProduct();
  }
});

productApp.mount("#app");
