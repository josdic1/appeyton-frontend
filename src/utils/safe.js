// src/utils/safe.js

export const safe = {
  /**
   * Always returns an array. Prevents .map() or .length crashes.
   */
  array: (x) => (Array.isArray(x) ? x : []),

  /**
   * Filters out nulls or primitives, ensuring you only iterate over actual objects.
   */
  arrayOfObjects: (x) => {
    if (!Array.isArray(x)) return [];
    return x.filter((item) => item !== null && typeof item === "object");
  },

  /**
   * Clean strings for UI display.
   */
  string: (x, fallback = "") => (typeof x === "string" ? x.trim() : fallback),

  /**
   * Safe ID handling. Converts numbers to strings for consistent key usage.
   */
  id: (x) => (x == null ? "" : String(x)),

  /**
   * Formats currency consistently (e.g., "$15.00").
   */
  currency: (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0),

  /**
   * Relative time (e.g., "5m ago").
   */
  timeAgo: (date) => {
    if (!date) return "";
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  },

  /**
   * Standard Date formatting for the Reservation Suite (e.g., "Mon, Feb 10").
   */
  date: (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  },

  /**
   * Percentage helper for progress bars and occupancy rates.
   */
  percentage: (value, total) => {
    if (!total || total === 0) return "0%";
    const pct = Math.round((value / total) * 100);
    return `${pct}%`;
  },
};

/**
 * Legacy export to maintain compatibility with existing imports
 */
export const asArrayOfObjects = safe.arrayOfObjects;
