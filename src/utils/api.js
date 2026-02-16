// src/utils/api.js

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) throw new Error("Missing VITE_API_URL");
  if (import.meta.env.PROD && url.includes("localhost")) {
    throw new Error("Production build pointing to localhost!");
  }
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

export const apiRequest = async (path, options = {}) => {
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  // Handle 401 Unauthorized globally
  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  const data =
    response.status !== 204 ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new Error(
      data?.detail || data?.message || `Error ${response.status}`,
    );
  }

  return data;
};

export const api = {
  get: (p) => apiRequest(p),
  post: (p, d) => apiRequest(p, { method: "POST", body: JSON.stringify(d) }),
  patch: (p, d) => apiRequest(p, { method: "PATCH", body: JSON.stringify(d) }),
  delete: (p) => apiRequest(p, { method: "DELETE" }),
};

export const retryRequest = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      // Exponential backoff: wait 1s, 2s, 3s
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
