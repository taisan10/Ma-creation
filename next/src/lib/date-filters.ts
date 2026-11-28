/**
 * Enterprise Date Filtering Utilities
 * Provides uniform date range calculations across all admin dashboard tables & charts.
 */

export type DatePreset =
  | "all"
  | "today"
  | "7d"
  | "this_month"
  | "last_month"
  | "6m"
  | "1y"
  | "custom";

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  all: "All Time",
  today: "Today",
  "7d": "Last 7 Days",
  this_month: "This Month",
  last_month: "Last Month",
  "6m": "Last 6 Months",
  "1y": "Last 1 Year",
  custom: "Custom Range",
};

export interface CustomDateRange {
  from?: Date;
  to?: Date;
}

/**
 * Calculates start and end timestamps for a given date preset.
 */
export function getDateRangeForPreset(
  preset: DatePreset,
  customRange?: CustomDateRange
): { start: Date | null; end: Date | null } {
  if (preset === "all") {
    return { start: null, end: null };
  }

  const now = new Date();

  if (preset === "custom") {
    if (!customRange?.from) return { start: null, end: null };
    const start = new Date(customRange.from);
    start.setHours(0, 0, 0, 0);
    const end = customRange.to ? new Date(customRange.to) : new Date(customRange.from);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (preset === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end };
  }

  if (preset === "7d") {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { start, end: now };
  }

  if (preset === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { start, end: now };
  }

  if (preset === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (preset === "6m") {
    const start = new Date(now.getFullYear(), now.getMonth() - 6, 1, 0, 0, 0, 0);
    return { start, end: now };
  }

  if (preset === "1y") {
    const start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return { start, end: now };
  }

  return { start: null, end: null };
}

/**
 * Filter an array of items by date using a given preset.
 */
export function filterItemsByDatePreset<T>(
  items: T[],
  getDate: (item: T) => string | number | Date | null | undefined,
  preset: DatePreset,
  customRange?: CustomDateRange
): T[] {
  if (preset === "all") return items;
  const { start, end } = getDateRangeForPreset(preset, customRange);
  if (!start) return items;

  return items.filter((item) => {
    const dVal = getDate(item);
    if (!dVal) return false;
    const time = new Date(dVal).getTime();
    if (isNaN(time)) return false;

    if (start && time < start.getTime()) return false;
    if (end && time > end.getTime()) return false;
    return true;
  });
}
