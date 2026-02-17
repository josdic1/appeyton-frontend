// src/utils/api.js

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || "http://localhost:8080"; // Fallback for safety
  if (import.meta.env.PROD && url.includes("localhost")) {
    throw new Error("Production build pointing to localhost!");
  }
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

export const apiRequest = async (path, options = {}) => {
  const baseUrl = getBaseUrl();
  // Ensure we don't end up with double slashes like //api
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

    // Handle 401 Unauthorized globally
    if (response.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error("Session expired");
    }

    // Return null for "No Content" but successful responses
    if (response.status === 204) return null;

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // Professional error extraction
      const errorMsg =
        data?.detail || data?.message || `Error ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(
      `[API Error] ${options.method || "GET"} ${path}:`,
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
      if (i === retries - 1) throw err;
      // Exponential backoff: 1s, 2s, 3s
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
