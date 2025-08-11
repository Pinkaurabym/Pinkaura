// js/checkout.js

// Initialize EmailJS with your Public Key (must match your EmailJS account)
emailjs.init('ErIegdUfhqmHObATu');

const app = Vue.createApp({
  data() {
    return {
      products: [],
      cart: JSON.parse(localStorage.getItem('cart') || '[]'),
      customer: { name: '', email: '', address: '', phone: '' },
      sending: false
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
    async submitOrder() {
      if (!this.customer.name || !this.customer.email) {
        alert('Please complete your details.');
        return;
      }
      if (!this.cart.length) {
        alert('Your bag is empty.');
        return;
      }

      // Build the items exactly as your EmailJS template expects
      const orders = this.cart.map(item => {
        const p = this.products.find(x => x.id === item.id) || {};
        const qty = Number(item.quantity || 0);
        const priceEach = Number(p.price) || 0;

        return {
          // used by {{name}}, {{units}}, {{price}} inside {{#orders}} ... {{/orders}}
          name: String(p.name || `#${item.id}`),
          units: String(qty),
          price: String((priceEach * qty).toFixed(2))
        };
      });

      const cost = {
        // used by {{cost.shipping}}, {{cost.tax}}, {{cost.total}}
        shipping: String(this.shipping.toFixed(2)),
        tax: '0.00',
        total: String(this.total.toFixed(2))
      };

      const order_id = 'ORD' + Date.now();

      // These keys must match your template variable names in EmailJS
      const tplParams = {
        order_id,
        user_email: this.customer.email,
        customer_name: this.customer.name,
        customer_address: this.customer.address,
        customer_phone: this.customer.phone,
        orders,
        cost
      };

      try {
        this.sending = true;

        // ONE send — no duplicates.
        await emailjs.send(
          'service_l2a19fl',   // your EmailJS Service ID
          'template_sv1pb1d',  // your EmailJS Template ID
          tplParams
        );

        // Optional: decrement local cache stock so UI looks right after redirect
        this.cart.forEach(item => {
          const p = this.products.find(prod => prod.id === item.id);
          if (!p || !Array.isArray(p.variants)) return;
          const v = p.variants.find(vr => vr.color === item.color) || p.variants[0];
          if (v) v.stock = Math.max(0, (Number(v.stock) || 0) - Number(item.quantity || 0));
        });
        localStorage.setItem('products', JSON.stringify(this.products));

        alert('Order confirmed & email sent! Thanks for shopping.');
        localStorage.removeItem('cart');
        window.location.href = 'index.html';
      } catch (err) {
        console.error('EmailJS error:', err);
        alert('Failed to send confirmation. Please try again.');
      } finally {
        this.sending = false;
      }
    }
  },

  async mounted() {
    // Load products from cached copy first (faster), else from /data
    const cached = localStorage.getItem('products');
    if (cached) {
      this.products = JSON.parse(cached);
    } else {
      this.products = await (await fetch('data/products.json')).json();
      localStorage.setItem('products', JSON.stringify(this.products));
    }
  }
});

app.mount('#app');
