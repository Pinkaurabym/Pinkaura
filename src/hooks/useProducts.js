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
      const API_URL = import.meta.env.VITE_API_URL || '';
      try {
        // Prefer live API (Supabase-backed). Falls back to static JSON only if API fails.
        const apiResponse = await fetch(`${API_URL}/api/products`);
        if (!apiResponse.ok) throw new Error('Failed to fetch products');

        const apiData = await apiResponse.json();
        if (!apiData.success || !Array.isArray(apiData.products)) {
          throw new Error('Invalid product payload');
        }

        setProducts(apiData.products);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(apiData.products));
      } catch (err) {
        setError(err.message);
        
        // Fallback to cached data if fetch fails
        try {
          const cachedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
          if (cachedProducts) {
            setProducts(JSON.parse(cachedProducts));
            return;
          }
          // As last resort, attempt static JSON (older data bundled with app)
          const staticResponse = await fetch('/data/products.json?t=' + Date.now());
          if (staticResponse.ok) {
            const staticData = await staticResponse.json();
            setProducts(staticData);
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(staticData));
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
