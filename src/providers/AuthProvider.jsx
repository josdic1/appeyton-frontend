// src/providers/AuthProvider.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { api } from "../utils/api";

function parseToken(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) return null; // expired
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
      // apiRequest throws a plain Error but we need the status for login
      // so we parse it back out of the message if it was a known HTTP error
      const status = err.status ?? inferStatus(err.message);
      return { success: false, error: err.message, status };
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

// Infer status from error message when the status wasn't attached to the Error object.
// apiRequest throws new Error(errorMsg) which loses the status code — this is a
// temporary bridge until apiRequest is updated to throw a proper HttpError class.
function inferStatus(message = "") {
  if (!message) return null;
  const m = message.toLowerCase();
  if (
    m.includes("account") &&
    (m.includes("inactive") || m.includes("suspended"))
  )
    return 403;
  if (m.includes("invalid credentials") || m.includes("unauthorized"))
    return 401;
  return null;
}
