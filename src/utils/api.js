// src/utils/api.js

export class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || "http://localhost:8080";
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

export const apiRequest = async (path, options = {}) => {
  const baseUrl = getBaseUrl();

  // ── THE AUTOMATIC PREFIX FIX ──
  // If the path doesn't already start with /api, add it.
  // This ensures /members becomes /api/members automatically.
  const normalizedPath = path.startsWith("/api")
    ? path.startsWith("/")
      ? path
      : `/${path}`
    : `/api${path.startsWith("/") ? path : `/${path}`}`;

  const url = `${baseUrl}${normalizedPath}`;
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
      if (window.location.pathname !== "/login")
        window.location.href = "/login";
      throw new HttpError("Session expired", 401);
    }

    if (response.status === 204) return null;
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        data?.detail || data?.message || `Error ${response.status}`;
      throw new HttpError(errorMsg, response.status);
    }

    return data;
  } catch (error) {
    console.error(
      `[API Error] ${options.method || "GET"} ${normalizedPath}:`,
      error.message,
    );
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

export const retryRequest = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable = !(err instanceof HttpError) || err.status >= 500;
      if (!isRetryable || i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
