import { useEffect, useRef } from 'react';

/**
 * Custom hook for intervals that persists function reference
 * @param callback - Function to call on interval
 * @param delay - Delay in milliseconds (null to pause)
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}