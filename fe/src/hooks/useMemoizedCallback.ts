// hooks/useMemoizedCallback.ts
import { useCallback, useMemo } from 'react';

/**
 * Custom hook that memoizes callback with dependencies
 * @param callback - Function to memoize
 * @param deps - Dependencies array
 * @returns Memoized callback
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Custom hook that memoizes expensive calculations
 * @param factory - Function that returns computed value
 * @param deps - Dependencies array
 * @returns Memoized value
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}