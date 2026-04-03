import { useState, useCallback, useEffect, useRef } from 'react';

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
  const timersRef = useRef(new Map());

  // Clear all pending timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(id => clearTimeout(id));
  }, []);

  const show = useCallback(({ type = 'info', message, duration = 3000 }) => {
    const id = Date.now();

    setNotifications((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      const timerId = setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        timersRef.current.delete(id);
      }, duration);
      timersRef.current.set(id, timerId);
    }

    return id;
  }, []);

  const remove = useCallback((id) => {
    clearTimeout(timersRef.current.get(id));
    timersRef.current.delete(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clear = useCallback(() => {
    timersRef.current.forEach(id => clearTimeout(id));
    timersRef.current.clear();
    setNotifications([]);
  }, []);

  return { notifications, show, remove, clear };
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
