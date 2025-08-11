const app = Vue.createApp({
  data() {
    return {
      products: [], categories: [], cart: [],
      searchTerm: "", selectedCategory: "All",
      trendingMode: false, bestSellerMode: false,
      isFilterPage: false, showCatMenu: false, sortType: null,
      // modal
      showModal: false,
      modalTitle: "",
      modalMessage: "",
      modalType: "" // "limit" for out-of-stock, "success" for added
    };
  },
  computed: {
    filteredProducts() {
      let list = this.products;
      if (this.selectedCategory !== "All") {
        list = list.filter(p => p.category === this.selectedCategory);
      }
      if (this.trendingMode) {
        list = list.filter(p => p.trending);
      }
      if (this.bestSellerMode) {
        list = list.filter(p => p.bestSeller);
      }
      if (this.searchTerm.trim()) {
        const t = this.searchTerm.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(t));
      }
      if (this.sortType === "priceAsc") {
        list = [...list].sort((a, b) => a.price - b.price);
      }
      if (this.sortType === "priceDesc") {
        list = [...list].sort((a, b) => b.price - a.price);
      }
      return list;
    },
    trendingProducts() {
      return this.products.filter(p => p.trending);
    },
    bestSellerProducts() {
      return this.products.filter(p => p.bestSeller);
    },
    cartCount() {
      return this.cart.reduce((sum, i) => sum + i.quantity, 0);
    }
  },
  methods: {
    goToBag() { this.showModal = false; window.location.href = "bag.html"; },
    firstVariant(p) { return (p.variants && p.variants[0]) ? p.variants[0] : null; },
    firstVariantStock(p) {
      const v = this.firstVariant(p); const s = Number(v?.stock);
      return Number.isFinite(s) ? s : 0;
    },

    addToBag(p) {
      const v = this.firstVariant(p);
      if (!v) {
        this.modalTitle = "Error";
        this.modalMessage = "No variants available.";
        this.modalType = "limit";
        this.showModal = true;
        return;
      }
      const color = v.color;
      const stock = this.firstVariantStock(p);

      const line = this.cart.find(x => x.id === p.id && x.color === color);
      const currentQty = line ? line.quantity : 0;

      if (currentQty >= stock) {
        this.modalTitle = "Can’t add more";
        this.modalMessage = `${currentQty} items already in bag (only ${stock} left)`;
        this.modalType = "limit";
        this.showModal = true;
        return;
      }

      if (line) line.quantity += 1;
      else this.cart.push({ id: p.id, color, quantity: 1 });
      localStorage.setItem("cart", JSON.stringify(this.cart));

      // Show success modal
      this.modalTitle = "Added to Bag";
      this.modalMessage = `${p.name} (${color}) has been added to your bag.`;
      this.modalType = "success";
      this.showModal = true;
      if (this.modalType === "success") {
        setTimeout(() => { this.showModal = false; }, 1800);
      }

    },


    goToCategoryPage(cat) {
      const params = new URLSearchParams();
      if (cat && cat !== "All") params.set("category", cat);
      window.location.href = `index.html?${params.toString()}`;
    },
    goToTrendingPage() {
      const params = new URLSearchParams();
      if (this.selectedCategory !== "All") params.set("category", this.selectedCategory);
      params.set("trending", "true");
      window.location.href = `index.html?${params.toString()}`;
    },
    goToBestSellerPage() {
      const params = new URLSearchParams();
      if (this.selectedCategory !== "All") params.set("category", this.selectedCategory);
      params.set("filter", "bestSeller");
      window.location.href = `index.html?${params.toString()}`;
    },
    goToProduct(id) {
      window.location.href = `product.html?id=${id}`;
    },
    sortByPriceAsc() {
      this.sortType = "priceAsc";
    },
    sortByPriceDesc() {
      this.sortType = "priceDesc";
    },
    stockLabel(p) {
      const n = this.firstVariantStock(p);
      return n === 0 ? 'Out of stock' : `${n} left`;
    }
  },
  mounted: async function () {
    const c = localStorage.getItem("cart");
    if (c) this.cart = JSON.parse(c);

    try {
      const { products } = await fetchCatalogFresh();
      this.products = products;
    } catch (e) {
      // graceful fallback
      const saved = localStorage.getItem('products');
      if (saved) this.products = JSON.parse(saved);
      else this.products = await (await fetch('data/products.json?v=' + Date.now())).json();
    }
    this.categories = Array.from(new Set(this.products.map(p => p.category))).sort();

    const p = new URLSearchParams(location.search);
    const cat = p.get("category"), trending = p.get("trending"), filter = p.get("filter");
    if (cat) { this.selectedCategory = cat; this.isFilterPage = true; }
    if (trending === "true") { this.trendingMode = true; this.isFilterPage = true; }
    if (filter === "bestSeller") { this.bestSellerMode = true; this.isFilterPage = true; }
  }
});

app.mount("#app");

async function fetchCatalogFresh() {
  // always bypass browser/CDN caches
  const r = await fetch('https://pinkaura.vercel.app/api/products?ts=' + Date.now(), {
    cache: 'no-store'
  });
  if (!r.ok) throw new Error('Catalog fetch failed');
  const { products, sha } = await r.json();

  const prevSha = localStorage.getItem('products_sha');
  if (sha && sha !== prevSha) {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('products_sha', sha);
  } else if (!localStorage.getItem('products')) {
    // first load
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('products_sha', sha || '');
  }
  return { products, sha };
}
