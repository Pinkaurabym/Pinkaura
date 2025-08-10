// js/product.js

const productApp = Vue.createApp({
  data() {
    return {
      product: null,
      selectedVariant: null,
      cart: [],
      // modal
      showModal: false,
      modalTitle: "",
      modalMessage: "",
      modalType: "" // "limit" or "success"
    };
  },
  computed: {
    images() {
      return this.selectedVariant ? this.selectedVariant.images : [];
    },
    cartCount() {
      return this.cart.reduce((sum, i) => sum + i.quantity, 0);
    },
    selectedStock() {
      const s = Number(this.selectedVariant?.stock);
      return Number.isFinite(s) ? s : 0;
    }
  },
  methods: {
    goBack() { history.back(); },

    loadCart() {
      this.cart = JSON.parse(localStorage.getItem("cart") || "[]");
    },
    saveCart() {
      localStorage.setItem("cart", JSON.stringify(this.cart));
    },

    addToBag() {
      if (!this.product || !this.selectedVariant) return;
      const color = this.selectedVariant.color;
      const stock = this.selectedStock;

      const line = this.cart.find(
        i => i.id === this.product.id && i.color === color
      );
      const currentQty = line ? line.quantity : 0;

      if (currentQty >= stock) {
        this.modalTitle = "Can’t add more";
        this.modalMessage = `${currentQty} items already in bag (only ${stock} left)`;
        this.modalType = "limit";
        this.showModal = true;
        return;
      }

      if (line) line.quantity += 1;
      else this.cart.push({ id: this.product.id, color, quantity: 1 });

      this.saveCart();

      // success modal
      this.modalTitle = "Added to Bag";
      this.modalMessage = `${this.product.name} (${color}) has been added to your bag.`;
      this.modalType = "success";
      this.showModal = true;
      setTimeout(() => (this.showModal = false), 1600);
    },

    selectVariant(v) {
      this.selectedVariant = v;
    },

    async fetchProduct() {
      const params = new URLSearchParams(window.location.search);
      const id = Number(params.get("id"));

      try {
        // prefer locally updated copy (after checkout)
        let data = null;
        const saved = localStorage.getItem("products");
        if (saved) data = JSON.parse(saved);
        else {
          data = await (await fetch("data/products.json")).json();
          localStorage.setItem("products", JSON.stringify(data));
        }

        this.product = data.find(p => p.id === id);
        if (!this.product) throw new Error("Product not found");
        this.selectedVariant = this.product.variants[0];
      } catch (err) {
        console.error("Could not load product data:", err);
      }
    },

    goToBag() {
      this.showModal = false;
      window.location.href = "bag.html";
    }
  },
  mounted() {
    this.loadCart();
    this.fetchProduct();
  }
});

productApp.mount("#app");
