import { useState } from 'react';
import { motion } from 'framer-motion';
import { useProducts } from '../hooks/useProducts';

/**
 * AdminPage - Product management interface
 * @component
 * @description Allows admin to add new products with automatic upload
 */
const AdminPage = () => {
  const { products } = useProducts();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Rings',
    description: '',
    trending: false,
    bestSeller: false,
    color: 'Gold',
    stock: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Simple password protection (change 'admin123' to your secure password)
  const ADMIN_PASSWORD = 'admin123';

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
      showNotification('✅ Access granted!', 'success');
    } else {
      showNotification('❌ Incorrect password', 'error');
      setPassword('');
    }
  };

  // Check if already logged in
  useState(() => {
    if (localStorage.getItem('adminAuth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const categories = ['Rings', 'Necklaces', 'Earrings', 'Bracelets'];
  const colors = ['Gold', 'Silver', 'Rose Gold', 'White', 'Black'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size must be less than 5MB', 'error');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error');
        return;
      }

      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showNotification('Product name is required', 'error');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      showNotification('Valid price is required', 'error');
      return;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      showNotification('Valid stock quantity is required', 'error');
      return;
    }
    if (!imageFile) {
      showNotification('Product image is required', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const formDataToSend = new FormData();
      formDataToSend.append('image', imageFile);
      formDataToSend.append('productData', JSON.stringify({
        name: formData.name.trim(),
        price: formData.price,
        category: formData.category,
        description: formData.description.trim(),
        trending: formData.trending,
        bestSeller: formData.bestSeller,
        color: formData.color,
        stock: formData.stock
      }));

      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.success) {
        showNotification('✅ Product added successfully! Refreshing...', 'success');
        resetForm();
        setTimeout(() => window.location.reload(), 2000);
      } else {
        showNotification(result.message || 'Failed to add product', 'error');
      }

    } catch (error) {
      console.error('Upload error:', error);
      showNotification('Failed to upload. Make sure backend server is running on port 3001.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: 'Rings',
      description: '',
      trending: false,
      bestSeller: false,
      color: 'Gold',
      stock: '',
    });
    setImageFile(null);
    setImagePreview(null);
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-50 via-pink-50 to-purple-50 flex items-center justify-center px-4">
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full font-semibold shadow-lg max-w-md text-center ${
              notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }`}
          >
            {notification.message}
          </motion.div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-dark-900 mb-2">🔒 Admin Access</h1>
            <p className="text-dark-600">Enter password to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter admin password"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3"
            >
              Login
            </button>
          </form>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Demo Mode:</strong> Default password is <code className="bg-yellow-100 px-2 py-1 rounded">admin123</code>
              <br />
              <span className="text-xs">Change this in AdminPage.jsx before deploying!</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-pink-50 to-purple-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full font-semibold shadow-lg max-w-md text-center ${
            notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}
        >
          {notification.message}
        </motion.div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-heading font-bold text-dark-900 mb-2">Admin Panel</h1>
              <p className="text-dark-600">Add new products to your catalog</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-dark-500">
                Total Products: <span className="font-bold text-pink-500">{products.length}</span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('adminAuth');
                  setIsAuthenticated(false);
                }}
                className="text-sm text-red-500 hover:text-red-600 font-medium"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., Little star band ring"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="190"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="3"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Color <span className="text-red-500">*</span>
              </label>
              <select
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {colors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Anti tarnish, adjustable size, etc."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Product Image <span className="text-red-500">*</span>
              </label>
              <div className="flex items-start gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-dark-300 rounded-xl p-6 text-center hover:border-pink-500 transition">
                    <svg className="w-12 h-12 mx-auto text-dark-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-dark-600">
                      {imageFile ? imageFile.name : 'Click to upload image'}
                    </p>
                    <p className="text-xs text-dark-400 mt-1">PNG, JPG up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                
                {imagePreview && (
                  <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-pink-500">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="trending"
                  checked={formData.trending}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
                />
                <span className="text-sm font-medium text-dark-700">Trending</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="bestSeller"
                  checked={formData.bestSeller}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
                />
                <span className="text-sm font-medium text-dark-700">Best Seller</span>
              </label>
            </div>

            <div className="md:col-span-2 flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`btn-primary flex-1 py-3 flex items-center justify-center gap-2 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Add Product'
                )}
              </button>
              <button
                onClick={resetForm}
                disabled={isLoading}
                className="btn-secondary px-6 py-3"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <span>ℹ️</span> Backend Required
            </h3>
            <p className="text-sm text-blue-800">
              Make sure the backend server is running on port 3001. Run: <code className="bg-blue-100 px-2 py-1 rounded font-mono">npm run server</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
