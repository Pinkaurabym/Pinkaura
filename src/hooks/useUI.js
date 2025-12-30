import { useState, useCallback } from 'react';

/**
 * useModal - Modal state management
 */

export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle, setIsOpen };
};

/**
 * useNotification - Toast notification management
 */

export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const show = useCallback(
    ({ type = 'info', message, duration = 3000 }) => {
      const id = Date.now();
      
      setNotifications((prev) => [
        ...prev,
        { id, type, message, duration },
      ]);

      if (duration > 0) {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, duration);
      }

      return id;
    },
    []
  );

  const remove = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    show,
    remove,
    clear,
  };
};

/**
 * useDebounce - Debounce a value
 */

export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

import { useEffect } from 'react';
