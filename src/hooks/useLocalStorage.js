/**
 * useLocalStorage - Persistent storage hook
 * @param {string} key - LocalStorage key
 * @param {*} initialValue - Default value if key doesn't exist
 * @returns {[*, Function, Function]} [storedValue, setValue, removeValue]
 * 
 * Usage:
 * const [value, setValue, remove] = useLocalStorage('key', defaultValue);
 */

import { useState } from 'react';

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Silent fail - return initial value if parsing fails
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // Silent fail - storage quota exceeded or other error
      console.warn(`Failed to save to localStorage [${key}]:`, error.message);
    }
  };

  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      // Silent fail
      console.warn(`Failed to remove from localStorage [${key}]:`, error.message);
    }
  };

  return [storedValue, setValue, removeValue];
};
