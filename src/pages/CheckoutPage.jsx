import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import { FREE_SHIPPING_THRESHOLD } from '../utils/constants';

const CheckoutPage = () => {
  const { cart, getCartTotal, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const { subtotal, shipping, total } = getCartTotal();
  
  // Multi-step checkout state
  const [step, setStep] = useState(1); // 1: Details, 2: Payment QR, 3: Confirmation
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState({});

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!customerDetails.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!customerDetails.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(customerDetails.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!customerDetails.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\d{10}$/.test(customerDetails.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone must be 10 digits';
    }
    
    if (!customerDetails.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Proceed to QR code step
  const handleProceedToPayment = () => {
    if (validateForm()) {
      setStep(2);
    }
  };

  /**
   * Confirm payment and send order confirmation
   * TODO: Integrate with actual email service (e.g., SendGrid, AWS SES)
   */
  const handleConfirmPayment = () => {
    // Here you would integrate with your email service
    // Order details: { cart, total, customerDetails }
    
    setStep(3);
    
    // TODO: Replace with actual email service integration
    setTimeout(() => {
      alert(`Order confirmation sent to ${customerDetails.email}`);
      // Clear cart after successful order
      clearCart();
    }, 500);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-50 via-pink-50 to-purple-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-4xl font-heading font-bold text-dark-900 mb-4">Your cart is empty</h1>
          <p className="text-dark-600 mb-8">Add some products to get started!</p>
          <Link to="/products" className="btn-primary inline-block">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Step 1: Customer Details Form
  const renderDetailsForm = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Customer Details Form */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-heading font-bold text-dark-900 mb-6">Customer Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={customerDetails.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  errors.name ? 'border-red-500' : 'border-dark-200'
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={customerDetails.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  errors.email ? 'border-red-500' : 'border-dark-200'
                }`}
                placeholder="your@email.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={customerDetails.phone}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  errors.phone ? 'border-red-500' : 'border-dark-200'
                }`}
                placeholder="10-digit phone number"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Delivery Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={customerDetails.address}
                onChange={handleInputChange}
                rows="3"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  errors.address ? 'border-red-500' : 'border-dark-200'
                }`}
                placeholder="Enter your complete delivery address"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>
          </div>
        </div>

        {/* Order Items Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-heading font-bold text-dark-900 mb-4">Order Items</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {cart.map((item) => (
              <div key={`${item.id}-${item.color}`} className="flex gap-4 pb-3 border-b border-dark-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-dark-900">{item.name}</h3>
                  <p className="text-sm text-dark-600">{item.color}</p>
                  <p className="text-pink-500 font-bold">₹{item.price} x {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
          <h2 className="text-xl font-heading font-bold text-dark-900 mb-6">Order Summary</h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-dark-700">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-dark-700">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
            </div>
            <div className="border-t border-dark-200 pt-3 flex justify-between text-lg font-bold text-dark-900">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>

          <button 
            onClick={handleProceedToPayment}
            className="btn-primary w-full mb-4 py-3 text-lg"
          >
            Proceed to Payment
          </button>

          <Link to="/products" className="block text-center text-sm text-dark-600 hover:text-dark-900">
            Continue Shopping
          </Link>

          <div className="mt-6 pt-6 border-t border-dark-200 text-sm text-dark-600 space-y-2">
            <div className="flex items-start gap-2">
              <span>🚚</span>
              <span>Free shipping on orders over ₹{FREE_SHIPPING_THRESHOLD}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: QR Code Payment
  const renderQRPayment = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <h2 className="text-2xl font-heading font-bold text-dark-900 mb-4">Scan to Pay</h2>
        <p className="text-dark-600 mb-8">Scan the QR code below to complete your payment of ₹{total}</p>
        
        {/* QR Code - Replace with actual QR code generation */}
        <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl p-8 mb-6 mx-auto max-w-sm">
          <div className="bg-white rounded-xl p-6 shadow-inner">
            {/* Placeholder - Replace with actual QR code component */}
            <div className="w-64 h-64 bg-dark-900 mx-auto flex items-center justify-center rounded-xl">
              <div className="text-center">
                <div className="text-white text-6xl mb-4">📱</div>
                <p className="text-white text-sm">QR Code Here</p>
                <p className="text-white text-xs opacity-75 mt-2">UPI ID: pinkaura@upi</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-pink-50 rounded-xl p-4 mb-6 text-left">
          <h3 className="font-semibold text-dark-900 mb-2">Customer Details:</h3>
          <div className="text-sm text-dark-700 space-y-1">
            <p><strong>Name:</strong> {customerDetails.name}</p>
            <p><strong>Email:</strong> {customerDetails.email}</p>
            <p><strong>Phone:</strong> {customerDetails.phone}</p>
            <p><strong>Address:</strong> {customerDetails.address}</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleConfirmPayment}
            className="btn-primary w-full py-3 text-lg"
          >
            I have completed the payment
          </button>
          
          <button
            onClick={() => setStep(1)}
            className="w-full py-3 text-dark-600 hover:text-dark-900 font-semibold"
          >
            ← Back to Details
          </button>
        </div>
      </div>
    </div>
  );

  // Step 3: Confirmation
  const renderConfirmation = () => (
    <div className="max-w-2xl mx-auto text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-sm p-8"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center">
          <span className="text-4xl text-white">✓</span>
        </div>
        
        <h2 className="text-3xl font-heading font-bold text-dark-900 mb-4">Order Confirmed!</h2>
        <p className="text-dark-600 mb-2">Thank you for your purchase, {customerDetails.name}!</p>
        <p className="text-dark-600 mb-8">
          A confirmation email has been sent to <strong>{customerDetails.email}</strong>
        </p>

        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-heading font-bold text-dark-900 mb-4">Order Summary</h3>
          <div className="space-y-2 mb-4">
            {cart.map((item) => (
              <div key={`${item.id}-${item.color}`} className="flex justify-between text-sm">
                <span className="text-dark-700">{item.name} ({item.color}) x {item.quantity}</span>
                <span className="font-semibold text-dark-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dark-200 pt-3 flex justify-between text-lg font-bold">
            <span>Total Paid</span>
            <span className="text-pink-500">₹{total}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link to="/products" className="btn-primary inline-block w-full py-3">
            Continue Shopping
          </Link>
          <Link to="/" className="block text-dark-600 hover:text-dark-900 font-semibold">
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-pink-50 to-purple-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className={`flex items-center ${step >= 1 ? 'text-pink-500' : 'text-dark-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 1 ? 'bg-pink-500 text-white' : 'bg-dark-200'
              }`}>
                1
              </div>
              <span className="ml-2 font-semibold hidden sm:inline">Details</span>
            </div>
            <div className={`h-1 w-16 ${step >= 2 ? 'bg-pink-500' : 'bg-dark-200'}`} />
            <div className={`flex items-center ${step >= 2 ? 'text-pink-500' : 'text-dark-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 2 ? 'bg-pink-500 text-white' : 'bg-dark-200'
              }`}>
                2
              </div>
              <span className="ml-2 font-semibold hidden sm:inline">Payment</span>
            </div>
            <div className={`h-1 w-16 ${step >= 3 ? 'bg-pink-500' : 'bg-dark-200'}`} />
            <div className={`flex items-center ${step >= 3 ? 'text-pink-500' : 'text-dark-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 3 ? 'bg-pink-500 text-white' : 'bg-dark-200'
              }`}>
                3
              </div>
              <span className="ml-2 font-semibold hidden sm:inline">Confirmation</span>
            </div>
          </div>
        </div>

        {/* Render current step */}
        {step === 1 && renderDetailsForm()}
        {step === 2 && renderQRPayment()}
        {step === 3 && renderConfirmation()}
      </div>
    </div>
  );
};

export default CheckoutPage;
