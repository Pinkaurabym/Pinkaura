// js/checkout.js

// Initialize EmailJS with your Public Key
emailjs.init('ErIegdUfhqmHObATu');

const app = Vue.createApp({
  data() {
    return {
      products: [],
      cart: JSON.parse(localStorage.getItem('cart')||'[]'),
      customer: { name:'', email:'', address:'', phone:'' }
    };
  },
  computed: {
    total() {
      return this.cart.reduce((sum, item) => {
        const p = this.products.find(x => x.id === item.id) || {};
        return sum + ((p.price || 0) * item.quantity);
      }, 0);
    }
  },
  methods: {
    async submitOrder() {
      // basic validation
      if (!this.customer.name || !this.customer.email) {
        return alert('Please complete your details.');
      }

      // build orders array
      const orders = this.cart.map(item => {
        const p = this.products.find(x => x.id === item.id) || {};
        const img = p.variants?.[0]?.images?.[0] || p.image;
        return {
          name: p.name,
          units: item.quantity,
          price: ((p.price||0)*item.quantity).toFixed(2),
          image_url: img
        };
      });

      // cost breakdown
      const cost = {
        shipping: '60.00',
        tax:      '0.00',
        total:    this.total.toFixed(2)
      };

      const order_id = 'ORD' + Date.now();

      // parameters for EmailJS
      const tplParams = {
        order_id,
        user_email:       this.customer.email,
        customer_name:    this.customer.name,
        customer_address: this.customer.address,
        customer_phone:   this.customer.phone,
        orders,
        cost
      };

      try {
        await emailjs.send(
          'service_l2a19fl',   // ← your Service ID
          'template_sv1pb1d',  // ← your Template ID
          tplParams
        );
        alert('Order confirmed & email sent! Thanks for shopping.');
        localStorage.removeItem('cart');
        window.location.href = 'index.html';
      } catch (err) {
        console.error('EmailJS error:', err);
        alert('Failed to send confirmation. Please try again.');
      }
    }
  },
  async mounted() {
    // fetch your product catalog
    this.products = await (await fetch('data/products.json')).json();
  }
});

app.mount('#app');
