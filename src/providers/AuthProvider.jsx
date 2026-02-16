// src/providers/AuthProvider.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { api, retryRequest } from "../utils/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        const userData = await retryRequest(() => api.get("/api/users/me"));
        setUser(userData);
      } catch (err) {
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
      const data = await api.post("/api/users/login", credentials); // Fixed endpoint
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
      await api.post("/api/users/register", formData); // Fixed endpoint
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
