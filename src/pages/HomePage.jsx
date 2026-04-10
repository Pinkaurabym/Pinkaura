import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/atoms/ProductCardSkeleton';
import { useProducts } from '../hooks/useProducts';

const SkeletonRow = ({ bg = 'bg-white/50' }) => (
  <section className={`py-14 px-4 sm:px-6 lg:px-8 ${bg}`}>
    <div className="max-w-7xl mx-auto">
      {/* Section heading placeholder */}
      <div className="flex items-center justify-between mb-8">
        <div
          className="h-8 w-48 rounded-full animate-shimmer"
          style={{
            backgroundImage: 'linear-gradient(90deg, #FCF0F8 0%, #F9D9E8 40%, #FCF0F8 80%)',
            backgroundSize: '2000px 100%',
          }}
        />
        <div
          className="h-9 w-24 rounded-full animate-shimmer"
          style={{
            backgroundImage: 'linear-gradient(90deg, #F9D9E8 0%, #F5B8D1 40%, #F9D9E8 80%)',
            backgroundSize: '2000px 100%',
          }}
        />
      </div>
      {/* Horizontal skeleton cards */}
      <div className="flex gap-6 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-none w-72 sm:w-80">
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  </section>
);

const HomePage = () => {
  const { products, loading } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [...new Set(products.map((p) => p.category))];
  const trendingProducts = products.filter((p) => p.trending);
  const bestSellerProducts = products.filter((p) => p.bestSeller);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-pink-50 to-purple-50">
      {/* Hero Section */}
      <section 
        className="relative overflow-hidden h-screen sm:h-[90vh] lg:h-[120vh] px-4 sm:px-6 lg:px-8 bg-center bg-no-repeat bg-fixed flex items-center justify-center"
        style={{backgroundImage: `url('/images/hero-optimized.jpg')`, backgroundSize: 'cover'}}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/25" aria-hidden="true" />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-4xl mx-auto text-center mb-12 text-white"
        >
          <h1 className="text-3xl sm:text-2xl font-script font-bold mb-6 drop-shadow-lg">
            ✨ Luxury Awaits ✨
          </h1>
          <p className="text-l text-white/90 mb-8 drop-shadow-md">
            Discover our exclusive collection of premium jewelry and accessories
          </p>
          <Link to="/products">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary text-lg px-8 py-4"
            >
              Explore Now
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* Skeleton sections while loading */}
      {loading && (
        <>
          <SkeletonRow bg="bg-white/50" />
          <SkeletonRow bg="bg-gradient-to-r from-pink-50 to-purple-50" />
          <SkeletonRow bg="bg-white/50" />
          <SkeletonRow bg="bg-gradient-to-r from-pink-50 to-purple-50" />
          <SkeletonRow bg="bg-gradient-to-r from-purple-50 to-pink-50" />
        </>
      )}

      {/* Category Teasers */}
      {!loading && categories.slice(0, 3).map((category, idx) => (
        <motion.section
          key={category}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className={`py-14 px-4 sm:px-6 lg:px-8 ${
            idx % 2 === 0
              ? 'bg-white/50'
              : 'bg-gradient-to-r from-pink-50 to-purple-50'
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-3xl sm:text-4xl font-heading font-bold text-dark-900"
              >
                {category}
              </motion.h2>
              <Link
                to={`/products?category=${encodeURIComponent(category)}`}
                className="btn-primary px-4 py-2 text-sm font-semibold whitespace-nowrap"
              >
                Show All
              </Link>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            >
              {products
                .filter((p) => p.category === category)
                .filter((p) => p.variants && p.variants.length > 0) // Filter out products without variants
                .slice(0, 5) // Limit to 5 products per category
                .map((product) => (
                  <motion.div
                    key={product.id}
                    variants={itemVariants}
                    className="flex-none w-72 sm:w-80 snap-start"
                  >
                    <ProductCard
                      product={product}
                      variant={product.variants[0]}
                    />
                  </motion.div>
                ))}
            </motion.div>
          </div>
        </motion.section>
      ))}

      {/* Trending Section */}
      {!loading && trendingProducts.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="py-14 px-4 sm:px-6 lg:px-8 bg-gradient-mint"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-3xl sm:text-4xl font-heading font-bold text-white"
              >
                Trending
              </motion.h2>
              <Link
                to="/products?category=trending"
                className="btn-primary px-4 py-2 text-sm font-semibold whitespace-nowrap"
              >
                Show All
              </Link>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            >
              {trendingProducts
                .filter((p) => p.variants && p.variants.length > 0)
                .map((product) => (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  className="flex-none w-72 sm:w-80 snap-start"
                >
                  <ProductCard
                    product={product}
                    variant={product.variants[0]}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Best Sellers Section */}
      {!loading && bestSellerProducts.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="py-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-50 to-pink-50"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-3xl sm:text-4xl font-heading font-bold text-dark-900"
              >
                Best Sellers
              </motion.h2>
              <Link
                to="/products?category=bestSeller"
                className="btn-primary px-4 py-2 text-sm font-semibold whitespace-nowrap"
              >
                Show All
              </Link>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            >
              {bestSellerProducts
                .filter((p) => p.variants && p.variants.length > 0)
                .map((product) => (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  className="flex-none w-72 sm:w-80 snap-start"
                >
                  <ProductCard
                    product={product}
                    variant={product.variants[0]}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Footer */}
      <footer className="bg-dark-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-dark-300">
            Developed by{' '}
            <a
              href="https://www.linkedin.com/in/zayeem-zaki/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              Zayeem Zaki
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
