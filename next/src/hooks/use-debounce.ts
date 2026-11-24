"use client";

import { useEffect, useState } from "react";

/**
 * Senior Debounce Hook (Zero 3rd party dependency)
 * Delays updating the debounced value until after the specified delay has elapsed.
 * Perfect for Search Inputs with TanStack Query.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
