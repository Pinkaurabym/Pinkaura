import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Custom hook to fetch and manage products
 * @returns {{ products: Array, loading: boolean, error: string|null }}
 */
export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch fresh data from JSON (cache-busting with timestamp)
        const response = await fetch('/data/products.json?t=' + Date.now());
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const productData = await response.json();
        setProducts(productData);
        
        // Cache in localStorage for offline fallback
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(productData));
      } catch (err) {
        setError(err.message);
        
        // Fallback to cached data if fetch fails
        try {
          const cachedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
          if (cachedProducts) {
            setProducts(JSON.parse(cachedProducts));
          }
        } catch (cacheError) {
          // Silent fail - cached data is corrupted
          setError('Failed to load products');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
};

/**
 * Custom hook to fetch a single product by ID
 * @param {string|number} id - Product ID
 * @returns {Object|null} Product object or null
 */
export const useProduct = (id) => {
  const { products } = useProducts();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (products.length > 0) {
      const foundProduct = products.find((p) => p.id === parseInt(id));
      setProduct(foundProduct || null);
    }
  }, [products, id]);

  return product;
};
