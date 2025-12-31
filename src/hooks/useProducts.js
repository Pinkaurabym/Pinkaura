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

        // Ensure all products have valid variants with images
        const validProducts = apiData.products
          .filter(p => p && p.variants && Array.isArray(p.variants) && p.variants.length > 0)
          .map(p => ({
            ...p,
            variants: p.variants.filter(v => v && v.images && Array.isArray(v.images) && v.images.length > 0)
          }))
          .filter(p => p.variants.length > 0);

        setProducts(validProducts);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(validProducts));
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message);
        
        // Fallback to cached data if fetch fails
        try {
          const cachedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
          if (cachedProducts) {
            const parsed = JSON.parse(cachedProducts);
            // Validate cached products
            const validCached = parsed
              .filter(p => p && p.variants && Array.isArray(p.variants) && p.variants.length > 0)
              .map(p => ({
                ...p,
                variants: p.variants.filter(v => v && v.images && Array.isArray(v.images) && v.images.length > 0)
              }))
              .filter(p => p.variants.length > 0);
            setProducts(validCached);
            return;
          }
          // As last resort, attempt static JSON (older data bundled with app)
          const staticResponse = await fetch('/data/products.json?t=' + Date.now());
          if (staticResponse.ok) {
            const staticData = await staticResponse.json();
            // Validate static products
            const validStatic = staticData
              .filter(p => p && p.variants && Array.isArray(p.variants) && p.variants.length > 0)
              .map(p => ({
                ...p,
                variants: p.variants.filter(v => v && v.images && Array.isArray(v.images) && v.images.length > 0)
              }))
              .filter(p => p.variants.length > 0);
            setProducts(validStatic);
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(validStatic));
          }
        } catch (cacheError) {
          // Silent fail - cached data is corrupted
          console.error('Fallback error:', cacheError);
          setError('Failed to load products');
          setProducts([]);
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
