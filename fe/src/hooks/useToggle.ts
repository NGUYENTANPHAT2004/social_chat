import { useState, useCallback } from 'react';

/**
 * Custom hook for managing boolean state with toggle functionality
 * @param initialValue - Initial boolean value (default: false)
 * @returns [value, toggle, setValue]
 */
export function useToggle(initialValue: boolean = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState<boolean>(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  return [value, toggle, setValue];
}



