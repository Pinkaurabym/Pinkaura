import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProducts } from '../hooks/useProducts';

/**
 * AdminPage - Product management interface
 * @component
 * @description Allows admin to add new products with variants and manage inventory
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
  });
  const [variants, setVariants] = useState([
    { number: 1, stock: '' }
  ]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [expandedVariants, setExpandedVariants] = useState({});

  // Password from environment variable (required)
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

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
  useEffect(() => {
    if (localStorage.getItem('adminAuth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const categories = ['Rings', 'Necklaces', 'Earrings', 'Bracelets'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index] = {
      ...newVariants[index],
      [field]: value
    };
    setVariants(newVariants);
  };

  const addVariant = () => {
    const maxNumber = Math.max(...variants.map(v => v.number), 0);
    setVariants([...variants, { number: maxNumber + 1, stock: '' }]);
  };

  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    } else {
      showNotification('At least one variant is required', 'error');
    }
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
    
    // Validate variants
    if (variants.length === 0) {
      showNotification('At least one variant is required', 'error');
      return;
    }

    for (const variant of variants) {
      if (!variant.number) {
        showNotification('Variant number is required for all variants', 'error');
        return;
      }
      if (!variant.stock || parseInt(variant.stock) < 0) {
        showNotification('Valid stock quantity is required for all variants', 'error');
        return;
      }
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
        variants: variants.map(v => ({
          number: v.number,
          stock: parseInt(v.stock)
        }))
      }));

      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText || 'Unknown error'}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Make sure backend is deployed and running.');
      }

      const result = await response.json();

      if (result.success) {
        showNotification('✅ Product added successfully! Refreshing...', 'success');
        resetForm();
        setTimeout(() => window.location.reload(), 2000);
      } else {
        showNotification(result.message || 'Failed to add product', 'error');
      }

    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        showNotification('❌ Cannot connect to backend. Deploy your backend to Render first!', 'error');
      } else {
        showNotification(`❌ ${error.message}`, 'error');
      }
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
    });
    setVariants([
      { number: 1, stock: '' }
    ]);
    setImageFile(null);
    setImagePreview(null);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product? This will also delete the image from Cloudinary.')) {
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText || 'Unknown error'}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response.');
      }

      const result = await response.json();

      if (result.success) {
        showNotification('✅ Product deleted successfully! Refreshing...', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showNotification(result.message || 'Failed to delete product', 'error');
      }

    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        showNotification('❌ Cannot connect to backend.', 'error');
      } else {
        showNotification(`❌ ${error.message}`, 'error');
      }
    }
  };

  const handleEditQuantity = (product) => {
    setEditingProduct({
      ...product,
      tempVariants: JSON.parse(JSON.stringify(product.variants))
    });
  };

  const handleSaveQuantity = async () => {
    if (!editingProduct) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_URL}/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variants: editingProduct.tempVariants
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText || 'Unknown error'}`);
      }

      const result = await response.json();

      if (result.success) {
        showNotification('✅ Quantities updated successfully! Refreshing...', 'success');
        setEditingProduct(null);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showNotification(result.message || 'Failed to update quantities', 'error');
      }

    } catch (error) {
      showNotification(`❌ ${error.message}`, 'error');
    }
  };

  const updateVariantStock = (variantIndex, newStock) => {
    setEditingProduct(prev => ({
      ...prev,
      tempVariants: prev.tempVariants.map((v, idx) => 
        idx === variantIndex ? { ...v, stock: parseInt(newStock) || 0 } : v
      )
    }));
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

            {/* Variants Section */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-dark-700">
                  Product Variants <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-sm bg-pink-500 text-white px-3 py-1 rounded-lg hover:bg-pink-600 transition"
                >
                  + Add Variant
                </button>
              </div>

              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div key={index} className="border border-dark-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-dark-700">Variant #{variants[index]?.number || index + 1}</span>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-dark-700 mb-1">
                          Variant Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={variant.number}
                          onChange={(e) => handleVariantChange(index, 'number', parseInt(e.target.value) || '')}
                          className="w-full px-3 py-2 border border-dark-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                          placeholder="1"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-dark-700 mb-1">
                          Stock <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                          className="w-full px-3 py-2 border border-dark-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
        </div>

        {/* Products List */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-heading font-bold text-dark-900 mb-6">Existing Products</h2>
          
          {products.length === 0 ? (
            <p className="text-center text-dark-500 py-8">No products yet. Add your first product above!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-200">
                    <th className="text-left py-3 px-4 font-semibold text-dark-700">Image</th>
                    <th className="text-left py-3 px-4 font-semibold text-dark-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-dark-700">Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-dark-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-dark-700">Variants</th>
                    <th className="text-left py-3 px-4 font-semibold text-dark-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-dark-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <motion.tr 
                      key={product.id} 
                      className="border-b border-dark-100 hover:bg-dark-50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="py-3 px-4">
                        <img 
                          src={product.variants[0].images[0]} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-dark-900">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-dark-500 truncate max-w-xs">{product.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-dark-700">₹{product.price}</td>
                      <td className="py-3 px-4 text-dark-700">{product.category}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setExpandedVariants(prev => ({
                            ...prev,
                            [product.id]: !prev[product.id]
                          }))}
                          className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition font-medium"
                        >
                          {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                        </button>
                        
                        {expandedVariants[product.id] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 space-y-1"
                          >
                            {product.variants.map((variant, idx) => (
                              <div key={idx} className="text-xs bg-dark-50 p-2 rounded border border-dark-200">
                                <div className="font-semibold text-dark-700">Variant #{variant.number}</div>
                                <div className="text-dark-600">Stock: {variant.stock}</div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {product.trending && (
                            <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">
                              🔥 Trending
                            </span>
                          )}
                          {product.bestSeller && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              ⭐ Best
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditQuantity(product)}
                            className="text-blue-500 hover:text-blue-700 font-medium text-sm px-3 py-1 rounded-lg hover:bg-blue-50 transition"
                          >
                            Edit Stock
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-500 hover:text-red-700 font-medium text-sm px-3 py-1 rounded-lg hover:bg-red-50 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Quantity Modal */}
        {editingProduct && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setEditingProduct(null)}
          >
            <motion.div 
              className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <h3 className="text-2xl font-heading font-bold text-dark-900 mb-6">
                Edit Stock: {editingProduct.name}
              </h3>

              <div className="space-y-4 mb-6">
                {editingProduct.tempVariants && editingProduct.tempVariants.map((variant, idx) => (
                  <div key={idx} className="border border-dark-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-dark-700">
                        Variant #{variant.number}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-2">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => updateVariantStock(idx, e.target.value)}
                        className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        min="0"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSaveQuantity}
                  className="btn-primary flex-1 py-3"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="btn-secondary px-6 py-3"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
