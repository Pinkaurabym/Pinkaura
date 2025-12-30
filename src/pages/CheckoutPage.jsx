import { useState } from 'react';
import { Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import { FREE_SHIPPING_THRESHOLD } from '../utils/constants';
import { isValidEmail, isValidPhone, isValidPinCode } from '../utils/validators';
import Spinner from '../components/atoms/Spinner';
import FormField from '../components/atoms/FormField';

const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const CheckoutPage = () => {
  const { cart, getCartTotal, clearCart } = useCartStore();
  const { subtotal, shipping, total } = getCartTotal();

  const [step, setStep] = useState(1);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    landmark: '',
    pincode: ''
  });
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!customerDetails.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!customerDetails.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(customerDetails.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!customerDetails.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!isValidPhone(customerDetails.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }

    if (customerDetails.alternatePhone.trim() && !isValidPhone(customerDetails.alternatePhone)) {
      newErrors.alternatePhone = 'Alternate phone must be 10 digits';
    }

    if (!customerDetails.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!customerDetails.landmark.trim()) {
      newErrors.landmark = 'Landmark is required';
    }

    if (!customerDetails.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!isValidPinCode(customerDetails.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePaymentScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_SCREENSHOT_SIZE) {
      alert('Screenshot size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setPaymentScreenshot(file);
    const reader = new FileReader();
    reader.onloadend = () => setPaymentScreenshotPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleProceedToPayment = () => {
    if (validateForm()) setStep(2);
  };

  const handleConfirmPayment = async () => {
    if (!paymentScreenshot) {
      alert('Please upload payment screenshot');
      return;
    }

    setIsSubmittingPayment(true);

    try {
      const formData = new FormData();
      formData.append('screenshot', paymentScreenshot);
      formData.append('cartItems', JSON.stringify(
        cart.map(item => ({
          id: item.id,
          variantNumber: item.variantNumber,
          quantity: item.quantity
        }))
      ));
      formData.append('customerDetails', JSON.stringify(customerDetails));
      formData.append('totalsFromClient', JSON.stringify({
        subtotal,
        shipping,
        total
      }));

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Server error: ${response.status}`);
      }

      setStep(3);
      clearCart();
    } catch (error) {
      alert(`Order creation failed: ${error.message}`);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const CartItemsList = ({ items, maxHeight = 'max-h-64' }) => (
    <div className={`space-y-3 ${maxHeight} overflow-y-auto`}>
      {items.map((item) => (
        <div key={`${item.id}-${item.variantNumber}`} className="flex gap-4 pb-3 border-b border-dark-100">
          <img
            src={item.image}
            alt={item.name}
            className="w-16 h-16 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-dark-900">{item.name}</h3>
            <p className="text-sm text-dark-600">Variant #{item.variantNumber}</p>
            <p className="text-pink-500 font-bold">₹{item.price} x {item.quantity}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const ProgressSteps = () => {
    const renderStep = (stepNum, label) => (
      <>
        <div className={`flex items-center ${step >= stepNum ? 'text-pink-500' : 'text-dark-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
            step >= stepNum ? 'bg-pink-500 text-white' : 'bg-dark-200'
          }`}>
            {stepNum}
          </div>
          <span className="ml-2 font-semibold hidden sm:inline">{label}</span>
        </div>
      </>
    );

    return (
      <div className="flex items-center justify-center gap-4 mb-6">
        {renderStep(1, 'Details')}
        <div className={`h-1 w-16 ${step >= 2 ? 'bg-pink-500' : 'bg-dark-200'}`} />
        {renderStep(2, 'Payment')}
        <div className={`h-1 w-16 ${step >= 3 ? 'bg-pink-500' : 'bg-dark-200'}`} />
        {renderStep(3, 'Confirmation')}
      </div>
    );
  };

  const renderDetailsForm = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-heading font-bold text-dark-900 mb-6">Customer Details</h2>
          <div className="space-y-4">
            <FormField
              label="Full Name"
              name="name"
              value={customerDetails.name}
              onChange={handleInputChange}
              error={errors.name}
              placeholder="Enter your full name"
              required
            />
            <FormField
              label="Email Address"
              name="email"
              type="email"
              value={customerDetails.email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder="your@email.com"
              required
            />
            <FormField
              label="Phone Number"
              name="phone"
              type="tel"
              value={customerDetails.phone}
              onChange={handleInputChange}
              error={errors.phone}
              placeholder="10-digit phone number"
              required
            />
            <FormField
              label="Alternate Phone Number"
              name="alternatePhone"
              type="tel"
              value={customerDetails.alternatePhone}
              onChange={handleInputChange}
              error={errors.alternatePhone}
              placeholder="10-digit alternate phone number"
            />
            <FormField
              label="Delivery Address"
              name="address"
              value={customerDetails.address}
              onChange={handleInputChange}
              error={errors.address}
              placeholder="Enter your complete delivery address"
              required
              rows={3}
            />
            <FormField
              label="Landmark"
              name="landmark"
              value={customerDetails.landmark}
              onChange={handleInputChange}
              error={errors.landmark}
              placeholder="e.g., Near Park, Next to Bank"
              required
            />
            <FormField
              label="Pincode"
              name="pincode"
              value={customerDetails.pincode}
              onChange={handleInputChange}
              error={errors.pincode}
              placeholder="6-digit pincode"
              required
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-heading font-bold text-dark-900 mb-4">Order Items</h2>
          <CartItemsList items={cart} />
        </div>
      </div>

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

          <div className="mt-6 pt-6 border-t border-dark-200 text-sm text-dark-600">
            <div className="flex items-start gap-2">
              <span>Free shipping on orders over ₹{FREE_SHIPPING_THRESHOLD}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQRPayment = () => {
    const DetailField = ({ label, value }) => (
      <div className="pb-4 border-b border-dark-200">
        <p className="text-xs uppercase tracking-wide font-semibold text-dark-600 mb-1">{label}</p>
        <p className="font-semibold text-dark-900 break-words text-xs sm:text-sm">{value}</p>
      </div>
    );

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-dark-900 mb-2">Complete Your Payment</h2>
            <p className="text-dark-600 text-sm sm:text-base">Scan the QR code and upload payment proof</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
            <div className="flex flex-col">
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 sm:p-8 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-dark-900 mb-2">Scan to Pay</h3>
                <p className="text-dark-600 text-sm mb-6">Pay <span className="font-bold text-pink-500 text-lg">₹{total}</span> using any UPI app</p>

                <div className="flex-1 flex items-center justify-center mb-6">
                  <div className="bg-white rounded-xl p-2 sm:p-3 shadow-md w-full max-w-xs">
                    <div className="w-full aspect-square bg-white rounded-lg overflow-hidden flex items-center justify-center border border-dark-100">
                      <img
                        src="/images/upi.png"
                        alt="UPI QR Code"
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-dark-200 pt-6">
                  <p className="text-xs text-dark-600 mb-2 uppercase tracking-wide font-semibold">Need Help?</p>
                  <p className="text-2xl font-bold text-pink-500">9876543210</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 flex-1">
                <h3 className="text-lg font-semibold text-dark-900 mb-6">Delivery Details</h3>
                <div className="text-sm text-dark-700 space-y-4">
                  <DetailField label="Name" value={customerDetails.name} />
                  <DetailField label="Phone" value={customerDetails.phone} />
                  {customerDetails.alternatePhone && (
                    <DetailField label="Alternate Phone" value={customerDetails.alternatePhone} />
                  )}
                  <DetailField label="Email" value={customerDetails.email} />
                  <DetailField label="Address" value={customerDetails.address} />
                  <DetailField label="Landmark" value={customerDetails.landmark} />
                  <div>
                    <p className="text-xs uppercase tracking-wide font-semibold text-dark-600 mb-1">Pincode</p>
                    <p className="font-semibold text-dark-900">{customerDetails.pincode}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Payment Screenshot Upload */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">!</div>
              <label className="text-base sm:text-lg font-heading font-bold text-red-700">
                Upload Payment Screenshot <span className="text-red-600">*</span>
              </label>
            </div>
            <p className="text-xs text-red-600 mb-4">This is required to verify your payment</p>

            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <label className="flex-1 w-full cursor-pointer">
                <div className="border-2 border-dashed border-red-400 rounded-xl p-4 sm:p-6 text-center hover:border-red-600 hover:bg-red-100 transition duration-200">
                  <svg className="w-10 sm:w-12 h-10 sm:h-12 mx-auto text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs sm:text-sm font-semibold text-red-700 break-words">
                    {paymentScreenshot ? paymentScreenshot.name : 'Click to upload screenshot'}
                  </p>
                  <p className="text-xs text-red-600 mt-1">PNG, JPG up to 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePaymentScreenshotChange}
                  className="hidden"
                  required
                />
              </label>

              {paymentScreenshotPreview && (
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden border-2 border-red-500 flex-shrink-0 shadow-md">
                  <img src={paymentScreenshotPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {!paymentScreenshot && (
              <p className="text-red-600 text-xs sm:text-sm mt-3 font-semibold">Screenshot upload is required to proceed</p>
            )}
          </div>

          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={handleConfirmPayment}
              disabled={!paymentScreenshot || isSubmittingPayment}
              className={`w-full py-3 sm:py-4 text-base sm:text-lg font-bold rounded-xl transition duration-200 ${
                !paymentScreenshot || isSubmittingPayment
                  ? 'bg-dark-300 text-dark-600 cursor-not-allowed'
                  : 'btn-primary shadow-lg hover:shadow-xl hover:scale-105'
              }`}
            >
              {isSubmittingPayment ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" color="white" />
                  Processing Payment...
                </span>
              ) : (
                '✓ Confirm Payment & Order'
              )}
            </button>

            <button
              onClick={() => {
                setStep(1);
                setPaymentScreenshot(null);
                setPaymentScreenshotPreview(null);
              }}
              className="w-full py-2 sm:py-3 text-dark-600 hover:text-dark-900 font-semibold text-sm sm:text-base hover:bg-dark-100 rounded-lg transition"
            >
              ← Back to Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-white rounded-2xl shadow-sm p-8">
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
              <div key={`${item.id}-${item.variantNumber}`} className="flex justify-between text-sm">
                <span className="text-dark-700">{item.name} (Variant #{item.variantNumber}) x {item.quantity}</span>
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
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-pink-50 to-purple-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <ProgressSteps />
        </div>

        {step === 1 && renderDetailsForm()}
        {step === 2 && renderQRPayment()}
        {step === 3 && renderConfirmation()}
      </div>
    </div>
  );
};

export default CheckoutPage;
