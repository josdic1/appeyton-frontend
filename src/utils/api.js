// src/utils/api.js

export class HttpError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
  }
}

const getBaseUrl = () => {
  // If VITE_API_URL is "http://localhost:8000/api", keep it.
  // If empty, we assume the Vite Proxy handles it.
  return import.meta.env.VITE_API_URL || "";
};

/**
 * FIXED: Minimal normalization.
 * Only adds /api if the baseUrl is empty (Vite Proxy mode).
 */
const normalizePath = (path) => {
  const baseUrl = getBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;

  // If we have a full URL in Env, don't force another /api prefix
  if (baseUrl) return p;

  // If using Vite Proxy, ensure /api is there
  return p.startsWith("/api") ? p : `/api${p}`;
};

export const apiRequest = async (path, options = {}) => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${normalizePath(path)}`;
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login")
        window.location.href = "/login?expired=true";
      throw new HttpError("Session expired", 401);
    }

    if (response.status === 204) return { data: null };

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new HttpError(
        payload?.detail || payload?.message || "API Error",
        response.status,
        payload,
      );
    }

    /**
     * CRITICAL CHANGE:
     * We return { data: payload } to mimic Axios.
     * This prevents 'res.data is undefined' in your components.
     */
    return { data: payload };
  } catch (err) {
    if (!(err instanceof HttpError))
      throw new HttpError("Network connection failed", 503);
    throw err;
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
    } catch (error) {
      if (!(error instanceof HttpError) || error.status >= 500) {
        if (i === retries - 1) throw error;
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
};
