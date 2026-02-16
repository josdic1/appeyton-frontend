// src/providers/AuthProvider.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { api, retryRequest } from "../utils/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hard reset: Nukes token and forces a clean page load to prevent state ghosts
  const forceLogout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("token");
      if (!token) return setLoading(false);

      try {
        // Retry logic handles blips in connection without kicking the user out
        const userData = await retryRequest(() => api.get("/users/me"));
        setUser(userData);
      } catch (err) {
        // Global 401 check: If unauthorized, don't ask questions, just logout.
        if (err?.message?.includes("401")) {
          forceLogout();
        } else {
          console.error("Session sync failed:", err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [forceLogout]);

  const login = async (credentials) => {
    try {
      const data = await api.post("/auth/login", credentials);
      const token = data?.access_token || data?.token;

      if (token) {
        localStorage.setItem("token", token);
        setUser(data.user);
        return { success: true };
      }
      throw new Error("Invalid server response");
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const signup = async (formData) => {
    try {
      await api.post("/auth/signup", formData);
      return await login({
        email: formData.email,
        password: formData.password,
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      logout: forceLogout,
      isAuthed: !!user,
    }),
    [user, loading, forceLogout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
