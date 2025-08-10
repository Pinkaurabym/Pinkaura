// js/checkout.js

// Initialize EmailJS with your Public Key
emailjs.init('ErIegdUfhqmHObATu');

const app = Vue.createApp({
  data() {
    return {
      products: [],
      cart: JSON.parse(localStorage.getItem('cart') || '[]'),
      customer: { name: '', email: '', address: '', phone: '' }
    };
  },
  computed: {
    subtotal() {
      return this.cart.reduce((sum, item) => {
        const p = this.products.find(x => x.id === item.id) || {};
        return sum + ((p.price || 0) * item.quantity);
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
        return alert('Please complete your details.');
      }

      const orders = this.cart.map(item => {
        const p = this.products.find(x => x.id === item.id) || {};
        const img = p.variants?.[0]?.images?.[0] || p.image;
        return {
          name: p.name,
          units: item.quantity,
          price: ((p.price || 0) * item.quantity).toFixed(2),
          image_url: img
        };
      });

      const cost = {
        shipping: this.shipping.toFixed(2),
        tax: '0.00',
        total: this.total.toFixed(2)
      };

      const order_id = 'ORD' + Date.now();

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
        // 1️⃣ Send email
        await emailjs.send(
          'service_l2a19fl',
          'template_sv1pb1d',
          tplParams
        );

        // 2️⃣ Update stock locally in memory
        this.cart.forEach(item => {
          const p = this.products.find(prod => prod.id === item.id);
          if (!p) return;
          const v = p.variants.find(vr => vr.color === item.color);
          if (v) v.stock = Math.max(0, (v.stock || 0) - item.quantity);
        });

        // 3️⃣ Send updated products.json to Vercel API route
        await fetch('/api/update-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: this.products })
        });

        // 4️⃣ Clear cart & redirect
        alert('Order confirmed & email sent! Thanks for shopping.');
        localStorage.removeItem('cart');
        window.location.href = 'index.html';

      } catch (err) {
        console.error('Checkout error:', err);
        alert('Something went wrong. Please try again.');
      }
    }
  },
  async mounted() {
    this.products = await (await fetch('data/products.json')).json();
  }
});

app.mount('#app');
