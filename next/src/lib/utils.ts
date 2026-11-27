import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Enterprise Safe Date Formatter (Prevents RangeError: Invalid time value crashes)
 */
export function formatSafeDate(
  dateVal: string | number | Date | null | undefined,
  pattern: string,
  fallback = "—"
): string {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (!isValid(d) || isNaN(d.getTime())) return fallback;
    return format(d, pattern);
  } catch {
    return fallback;
  }
}
