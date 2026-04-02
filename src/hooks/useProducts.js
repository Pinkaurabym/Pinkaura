import { useCallback, useEffect, useRef, useState } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function loadCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const cachedAt = Number(localStorage.getItem(STORAGE_KEYS.PRODUCTS_CACHED_AT) || 0);
    if (raw && Date.now() - cachedAt < CACHE_TTL_MS) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore corrupted cache
  }
  return null;
}

/**
 * Custom hook to fetch and manage products
 * @returns {{ products: Array, loading: boolean, error: string|null, refetch: Function }}
 */
export const useProducts = () => {
  const cached = useRef(loadCache());
  const [products, setProducts] = useState(cached.current ?? []);
  const [loading, setLoading] = useState(!cached.current); // skip spinner if cache hit
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    const API_URL = import.meta.env.VITE_API_URL || '';
    // Only show loading spinner if we have nothing to display yet
    setLoading(prev => (products.length === 0 ? true : prev));
    try {
      const apiResponse = await fetch(`${API_URL}/api/products`);
      if (!apiResponse.ok) throw new Error('Failed to fetch products');

      const apiData = await apiResponse.json();
      if (!apiData.success || !Array.isArray(apiData.products)) {
        throw new Error('Invalid product payload');
      }

      const validProducts = apiData.products
        .filter(p => p && p.variants && Array.isArray(p.variants) && p.variants.length > 0)
        .map(p => ({
          ...p,
          variants: p.variants.filter(v => v && v.images && Array.isArray(v.images) && v.images.length > 0)
        }))
        .filter(p => p.variants.length > 0);

      setProducts(validProducts);
      setError(null);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(validProducts));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS_CACHED_AT, String(Date.now()));
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Always fetch fresh data on mount; cached data shows immediately while this loads
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
};

/**
 * Custom hook to fetch a single product by ID
 * @param {string|number} id - Product ID
 * @returns {Object|null} Product object or null
 */
export const useProduct = (id) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      const API_URL = import.meta.env.VITE_API_URL || '';
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/products/${id}`);
        if (!response.ok) throw new Error('Failed to fetch product');

        const data = await response.json();
        if (!data.success || !data.product) {
          throw new Error('Product not found');
        }

        setProduct(data.product);
        setError(null);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  return { product, loading, error };
};
