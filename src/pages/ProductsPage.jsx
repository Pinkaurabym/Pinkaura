import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../hooks/useProducts';
import useCartStore from '../store/cartStore';

const ProductsPage = () => {
  const { products, loading, error } = useProducts();
  const { addToCart } = useCartStore();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const categoryParam = searchParams.get('category');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    categoryParam === 'trending' || categoryParam === 'bestSeller'
      ? 'all'
      : categoryParam || 'all'
  );
  const [sort, setSort] = useState('featured');

  const showCategoryFilter = !categoryParam || categoryParam === 'trending' || categoryParam === 'bestSeller';

  const categoryOptions = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
    return unique;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Handle incoming query param first
    if (categoryParam === 'trending') {
      result = result.filter((p) => p.trending);
    } else if (categoryParam === 'bestSeller') {
      result = result.filter((p) => p.bestSeller);
    } else if (categoryParam) {
      result = result.filter((p) => p.category === categoryParam);
    }

    // Local category filter (overrides to "all" when selected)
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Search by name/description
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
      );
    }

    // Sort by price
    if (sort === 'price-asc') {
      result = result.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      result = result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, categoryParam, selectedCategory, search, sort]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-pink-50 to-purple-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-3 items-center justify-center text-center mb-10 bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-4 shadow-sm">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-dark-100 bg-white/80 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">🔍</span>
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            {showCategoryFilter && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-dark-100 bg-white/80 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm"
              >
                <option value="all">All categories</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded-xl border border-dark-100 bg-white/80 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20 text-dark-600 font-semibold">
            Loading products...
          </div>
        )}

        {error && !loading && (
          <div className="flex justify-center py-12 text-red-600 font-semibold">
            {error}
          </div>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-xl font-semibold text-dark-800">
              No products found{categoryParam ? ` in ${categoryParam}` : ''}.
            </p>
            <Link
              to="/products"
              className="btn-primary px-5 py-3 text-sm font-semibold"
            >
              View all products
            </Link>
          </div>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProducts.map((product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <ProductCard
                  product={product}
                  variant={product.variants[0]}
                  onClick={() => addToCart(product, product.variants[0])}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
