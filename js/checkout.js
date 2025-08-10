// js/checkout.js

// Initialize EmailJS with your Public Key
emailjs.init('ErIegdUfhqmHObATu');

// Vercel API endpoint (production domain from your Vercel project)
const VERCEL_API = 'https://pinkaura.vercel.app/api/checkout';

const app = Vue.createApp({
  data() {
    return {
      products: [],
      cart: JSON.parse(localStorage.getItem('cart') || '[]'),
      customer: { name: '', email: '', address: '', phone: '' },
      // optional modal for friendly errors/success
      showModal: false,
      modalTitle: '',
      modalMessage: '',
      modalType: ''
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
      // basic validation
      if (!this.customer.name || !this.customer.email) {
        this.toast('Missing Info', 'Please complete your details.', 'limit');
        return;
      }
      if (this.cart.length === 0) {
        this.toast('Cart is empty', 'Add some items before checkout.', 'limit');
        return;
      }

      // build orders array for email
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
        // EmailJS prefers strings; send JSON strings for arrays/objects if your template needs them
        orders_json: JSON.stringify(orders),
        cost_json: JSON.stringify(cost)
      };

      try {
        // 1) Send email via EmailJS
        await emailjs.send('service_l2a19fl', 'template_sv1pb1d', tplParams);

        // 2) Ask Vercel API to decrement stock in GitHub (authoritative)
        const payload = {
          cart: this.cart.map(i => ({
            id: i.id,
            color: i.color,
            qty: i.quantity
          }))
        };

        const resp = await fetch(VERCEL_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!resp.ok) {
          const { error } = await resp.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error('Stock update failed: ' + error);
        }

        // 3) Update local cache immediately with server's updated products
        const { productsUpdated } = await resp.json();
        if (Array.isArray(productsUpdated)) {
          localStorage.setItem('products', JSON.stringify(productsUpdated));
          this.products = productsUpdated;
        }

        // 4) Finish
        this.toast('Order Confirmed', 'Order placed & email sent! Thank you.', 'success');
        setTimeout(() => {
          localStorage.removeItem('cart');
          window.location.href = 'index.html';
        }, 1200);

      } catch (err) {
        console.error('Checkout error:', err);
        this.toast('Couldn’t finish checkout', String(err.message || err), 'limit');
      }
    },

    toast(title, msg, type = 'success') {
      this.modalTitle = title;
      this.modalMessage = msg;
      this.modalType = type;
      this.showModal = true;
      if (type === 'success') setTimeout(() => (this.showModal = false), 1500);
    }
  },

  async mounted() {
    // Prefer latest cache (gets refreshed after successful checkout)
    const saved = localStorage.getItem('products');
    if (saved) {
      this.products = JSON.parse(saved);
    } else {
      this.products = await (await fetch('data/products.json')).json();
      localStorage.setItem('products', JSON.stringify(this.products));
    }
  }
});

app.mount('#app');
