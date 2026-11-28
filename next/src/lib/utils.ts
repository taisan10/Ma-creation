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

/**
 * Enterprise Indian Rupee Formatter (e.g. ₹4,999)
 */
export function formatINR(
  amount?: number | string | null,
  fallback = "₹0"
): string {
  if (amount === undefined || amount === null || amount === "") return fallback;
  const num = typeof amount === "string" ? Number(amount) : amount;
  if (isNaN(num)) return fallback;
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
}

/**
 * Enterprise Safe Avatar Initials Generator
 * Examples: "Rahul Sharma" -> "RS", "Tarun" -> "TA", "" -> "U"
 */
export function getInitials(name?: string | null, fallback = "U"): string {
  if (!name || typeof name !== "string") return fallback;
  const clean = name.trim();
  if (!clean) return fallback;
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

