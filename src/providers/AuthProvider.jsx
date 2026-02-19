import { useState, useEffect, useMemo, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { api } from "../utils/api";

/**
 * Decodes JWT payload without a library.
 * Returns null if token is expired or malformed.
 */
function parseToken(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const payload = JSON.parse(jsonPayload);
    // Check expiration (exp is in seconds, Date.now() in ms)
    if (payload.exp * 1000 < Date.now()) return null;
    return payload; // Returns { sub, role, exp, name, member_id, etc. }
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

  /**
   * Initial Mount: Hydrate user from localStorage
   */
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    const payload = parseToken(token);
    if (!payload) {
      console.warn("Token expired or invalid on mount.");
      forceLogout();
    } else {
      // Ensure we map the payload to the shape the Reservation Form expects
      setUser({
        id: payload.user_id || payload.sub,
        member_id: payload.member_id || payload.user_id || payload.sub,
        name: payload.name || payload.email || "Member",
        role: payload.role || "user",
      });
    }
    setLoading(false);
  }, [forceLogout]);

  const login = async (credentials) => {
    try {
      // 1. Get the wrapped response from api.js
      const response = await api.post("/users/login", credentials);

      // 2. Extract data (api.js returns { data: payload })
      const payload = response.data;
      const token = payload?.access_token;

      if (!token) {
        throw new Error("Invalid server response: Missing access token");
      }

      localStorage.setItem("token", token);

      // 3. Extract the user object.
      // If your backend sends { user: {...}, access_token: "..." }
      const rawUser = payload.user || payload;

      const userData = {
        id: rawUser.id || rawUser.user_id,
        member_id: rawUser.member_id || rawUser.id || rawUser.user_id,
        name: rawUser.name || credentials.email || "Primary Member",
        role: rawUser.role || "user",
      };

      setUser(userData);
      return { success: true };
    } catch (err) {
      console.error("Login Engine Failure:", err);
      // HttpError provides the real status code (like that 401 you saw)
      return {
        success: false,
        error: err.message,
        status: err.status ?? null,
        data: err.data,
      };
    }
  };

  const signup = async (formData) => {
    try {
      // Registers the user
      await api.post("/users/", formData);
      // Automatically logs them in after successful signup
      return await login({
        email: formData.email,
        password: formData.password,
      });
    } catch (err) {
      return { success: false, error: err.message, status: err.status };
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
