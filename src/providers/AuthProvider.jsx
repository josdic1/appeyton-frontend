// src/providers/AuthProvider.jsx
// FIX: Now uses HttpError.status directly — no more inferStatus() bridge.
//      The bridge existed because apiRequest threw plain Error, losing status.
//      With HttpError, we get the real status code every time.
import { useState, useEffect, useMemo, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { api } from "../utils/api";

function parseToken(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) return null;
    return payload; // { user_id, role, exp }
  } catch {
    return null;
  }
}

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
    const token = localStorage.getItem("token");
    if (!token) return setLoading(false);

    const payload = parseToken(token);
    if (!payload) {
      forceLogout();
    } else {
      setUser({ id: payload.user_id, role: payload.role });
    }
    setLoading(false);
  }, [forceLogout]);

  const login = async (credentials) => {
    try {
      const data = await api.post("/api/users/login", credentials);
      const token = data?.access_token;
      if (!token) throw new Error("Invalid server response");

      localStorage.setItem("token", token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      // HttpError now carries .status directly — no inference needed
      return { success: false, error: err.message, status: err.status ?? null };
    }
  };

  const signup = async (formData) => {
    try {
      await api.post("/api/users/", formData);
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
