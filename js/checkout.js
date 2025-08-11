// js/checkout.js

// Initialize EmailJS with your Public Key
emailjs.init('ErIegdUfhqmHObATu');

const API_BASE = 'https://pinkaura.vercel.app/api';

const app = Vue.createApp({
  data() {
    return {
      products: [],
      cart: JSON.parse(localStorage.getItem('cart') || '[]'),
      customer: { name: '', email: '', address: '', phone: '' },
      sending: false,

      // modal
      showModal: false,
      modalTitle: '',
      modalMessage: '',
      modalOnClose: null
    };
  },

  computed: {
    subtotal() {
      return this.cart.reduce((sum, item) => {
        const p = this.products.find(x => x.id === item.id) || {};
        return sum + ((Number(p.price) || 0) * Number(item.quantity || 0));
      }, 0);
    },
    shipping() {
      return this.cart.length > 0 ? 60 : 0;
    },
    total() {
      return this.subtotal + this.shipping;
    }
  },

  methods: {
    // ---------- Modal ----------
    openModal(title, message, onClose = null) {
      this.modalTitle = title;
      this.modalMessage = message;
      this.modalOnClose = onClose;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      const fn = this.modalOnClose;
      this.modalOnClose = null;
      if (typeof fn === 'function') fn();
    },

    // ---------- Catalog ----------
    async fetchCatalogFresh() {
      const r = await fetch(`${API_BASE}/products?ts=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) throw new Error('Catalog fetch failed');
      const { products, sha } = await r.json();
      if (sha) localStorage.setItem('products_sha', sha);
      if (Array.isArray(products)) localStorage.setItem('products', JSON.stringify(products));
      return { products, sha };
    },

    // Normalize cart for server: ensure qty and color exist
    buildServerCart() {
      return this.cart.map(item => {
        const p = this.products.find(x => x.id === item.id) || {};
        const color = item.color || (p.variants && p.variants[0]?.color) || '';
        return {
          id: Number(item.id),
          color: String(color),
          qty: Number(item.quantity || 0)
        };
      });
    },

    // Basic pre-check against current products (optional but nice)
    preflightStock(serverCart) {
      for (const line of serverCart) {
        const prod = this.products.find(x => Number(x.id) === line.id);
        const variant = prod?.variants?.find(v => String(v.color || '').toLowerCase() === String(line.color).toLowerCase());
        if (!prod || !variant) {
          throw new Error(`Variant not found for product #${line.id} (${line.color || 'no color'})`);
        }
        const have = Number(variant.stock || 0);
        if (line.qty > have) {
          throw new Error(`Only ${have} left for ${prod.name} (${variant.color}).`);
        }
      }
    },

    // EmailJS params matching your template (repeater + nested cost)
    buildEmailParams(order_id) {
      const orders = this.cart.map(item => {
        const p = this.products.find(x => x.id === item.id) || {};
        const qty = Number(item.quantity || 0);
        const priceEach = Number(p.price) || 0;
        const nameWithColor = p.name + (item.color ? ` (${item.color})` : '');
        return {
          name: String(nameWithColor || `#${item.id}`),
          units: String(qty),
          price: String((priceEach * qty).toFixed(2))
        };
      });

      const cost = {
        shipping: String(this.shipping.toFixed(2)),
        tax: '0.00',
        total: String(this.total.toFixed(2))
      };

      return {
        order_id,
        user_email:       String(this.customer.email || ''),
        customer_name:    String(this.customer.name || ''),
        customer_address: String(this.customer.address || ''),
        customer_phone:   String(this.customer.phone || ''),
        orders,
        cost
      };
    },

    async submitOrder() {
      if (!this.customer.name || !this.customer.email) {
        this.openModal('Missing info', 'Please enter your name and email.');
        return;
      }
      if (!this.cart.length) {
        this.openModal('Empty bag', 'Your bag is empty.');
        return;
      }

      const serverCart = this.buildServerCart();
      try { this.preflightStock(serverCart); }
      catch (e) { this.openModal('Out of stock', e.message); return; }

      try {
        this.sending = true;

        // 1) Decrement stock on server (expects {id,color,qty})
        const resp = await fetch(`${API_BASE}/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cart: serverCart, customer: this.customer })
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || data.ok === false) {
          const msg = data.error || data.message || `Checkout failed (HTTP ${resp.status})`;
          this.openModal('Checkout failed', msg);
          return;
        }

        // Accept either shape from API
        const updatedProducts = Array.isArray(data.products)
          ? data.products
          : (Array.isArray(data.productsUpdated) ? data.productsUpdated : null);
        if (updatedProducts) {
          this.products = updatedProducts;
          localStorage.setItem('products', JSON.stringify(updatedProducts));
        } else {
          // Fallback refresh
          const fresh = await this.fetchCatalogFresh().catch(() => null);
          if (fresh?.products) this.products = fresh.products;
        }
        if (data.sha) localStorage.setItem('products_sha', data.sha);

        const order_id = data.order_id || data.orderId || ('ORD' + Date.now());

        // 2) Email confirmation (template stays the same)
        const tplParams = this.buildEmailParams(order_id);
        await emailjs.send('service_l2a19fl', 'template_sv1pb1d', tplParams);

        // 3) Success UI
        this.openModal(
          'Order confirmed 🎉',
          `Your order #${order_id} is confirmed.\nPlease check your email for the receipt.`,
          () => {
            localStorage.removeItem('cart');
            window.location.href = 'index.html';
          }
        );
      } catch (err) {
        console.error('Checkout Error:', err);
        this.openModal('Error', 'Something went wrong. Please try again.');
      } finally {
        this.sending = false;
      }
    }
  },

  async mounted() {
    // Load freshest catalog first (so stock/price are current)
    try {
      const { products } = await this.fetchCatalogFresh();
      if (Array.isArray(products)) {
        this.products = products;
        return;
      }
    } catch {}
    const saved = localStorage.getItem('products');
    if (saved) this.products = JSON.parse(saved);
    else this.products = await (await fetch('data/products.json?v=' + Date.now())).json();
  }
});

app.mount('#app');
