import { useCallback, useState, useEffect } from 'react';

/**
 * useFilters - Product filtering & sorting
 * Handles category filtering, sorting, price range filtering, and search
 */

export const useFilters = (products = []) => {
  const [category, setCategory] = useState(null);
  const [sortBy, setSortBy] = useState('recent'); // recent, priceAsc, priceDesc, trending
  const [priceRange, setPriceRange] = useState([0, Infinity]);
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Apply all filters and sorting
   */
  const filtered = useCallback(() => {
    let result = [...products];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (category) {
      result = result.filter((p) => p.category === category);
    }

    // Price range filter
    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Sorting
    switch (sortBy) {
      case 'priceAsc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'trending':
        result.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0));
        break;
      case 'bestseller':
        result.sort((a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0));
        break;
      default:
        break;
    }

    return result;
  }, [products, category, sortBy, priceRange, searchTerm]);

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setCategory(null);
    setSortBy('recent');
    setPriceRange([0, Infinity]);
    setSearchTerm('');
  }, []);

  /**
   * Get all categories from products
   */
  const categories = [...new Set(products.map((p) => p.category))];

  /**
   * Get price range from products
   */
  const minPrice = Math.min(...products.map((p) => p.price));
  const maxPrice = Math.max(...products.map((p) => p.price));

  /**
   * Count active filters
   */
  const activeFilterCount = [
    category ? 1 : 0,
    searchTerm ? 1 : 0,
    sortBy !== 'recent' ? 1 : 0,
    priceRange[1] !== Infinity ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return {
    filtered: filtered(),
    category,
    setCategory,
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    searchTerm,
    setSearchTerm,
    resetFilters,
    categories,
    minPrice,
    maxPrice,
    activeFilterCount,
    hasFiltersActive: activeFilterCount > 0,
  };
};
