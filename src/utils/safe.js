// src/utils/safe.js

export const safe = {
  // Always returns an array, prevents .map() crashes
  array: (x) => (Array.isArray(x) ? x : []),

  // Clean strings for UI display
  string: (x, fallback = "") => (typeof x === "string" ? x.trim() : fallback),

  // Safe ID handling (Backend might send int, Frontend needs string)
  id: (x) => (x == null ? "" : String(x)),

  // Formats currency consistently
  currency: (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0),

  // Relative time (e.g., "5 mins ago")
  timeAgo: (date) => {
    if (!date) return "";
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  },
};
