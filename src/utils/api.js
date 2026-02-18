// src/utils/api.js
// FIX 1: Added HttpError class so status codes are never lost.
//         Eliminates the inferStatus() bridge hack in AuthProvider.
// FIX 2: retryRequest now only retries network errors and 5xx responses.
//         Previously it retried 401/403/404/422 causing multi-second delays
//         on every expected error.

export class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || "http://localhost:8080";
  if (import.meta.env.PROD && url.includes("localhost")) {
    throw new Error("Production build pointing to localhost!");
  }
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

export const apiRequest = async (path, options = {}) => {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${cleanPath}`;

  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new HttpError("Session expired", 401);
    }

    if (response.status === 204) return null;

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        data?.detail || data?.message || `Error ${response.status}`;
      // Throw HttpError with status so callers don't need to guess
      throw new HttpError(errorMsg, response.status);
    }

    return data;
  } catch (error) {
    if (!(error instanceof HttpError)) {
      // Network error — wrap it
      console.error(
        `[API Network Error] ${options.method || "GET"} ${path}:`,
        error.message,
      );
    } else {
      console.error(
        `[API Error] ${options.method || "GET"} ${path}: ${error.status} ${error.message}`,
      );
    }
    throw error;
  }
};

export const api = {
  get: (p) => apiRequest(p, { method: "GET" }),
  post: (p, d) => apiRequest(p, { method: "POST", body: JSON.stringify(d) }),
  put: (p, d) => apiRequest(p, { method: "PUT", body: JSON.stringify(d) }),
  patch: (p, d) => apiRequest(p, { method: "PATCH", body: JSON.stringify(d) }),
  delete: (p) => apiRequest(p, { method: "DELETE" }),
};

// FIXED: Only retry on network errors or 5xx server errors.
// Do NOT retry 4xx — those are client mistakes, retrying just adds latency.
export const retryRequest = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable =
        !(err instanceof HttpError) || // network error (no status)
        err.status >= 500; // server error

      if (!isRetryable || i === retries - 1) throw err;

      // Exponential backoff: 1s, 2s, 3s
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
