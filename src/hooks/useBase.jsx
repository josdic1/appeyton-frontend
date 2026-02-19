// src/hooks/useBase.js
import { useState, useCallback } from "react";
import { api, retryRequest } from "../utils/api";
import { safe } from "../utils/safe";

/**
 * useBase: Unified CRUD operations for Sterling entities.
 * @param {string} basePath - The resource endpoint (e.g., 'reservations')
 */
export function useBase(basePath) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Normalize path: ensures no double slashes and consistent /api prefixing
  const cleanPath = basePath.replace(/^\/+/, "");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // The api utility handles the leading /api/ prefix
      const data = await retryRequest(() => api.get(cleanPath));
      const sanitizedData = safe.array(data);
      setItems(sanitizedData);
      return { success: true, data: sanitizedData };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [cleanPath]);

  const fetchOne = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const data = await retryRequest(() => api.get(`${cleanPath}/${id}`));
        return { success: true, data };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [cleanPath],
  );

  const create = useCallback(
    async (payload) => {
      setLoading(true);
      setError(null);
      try {
        const created = await retryRequest(() => api.post(cleanPath, payload));
        setItems((prev) => [...prev, created]);
        return { success: true, data: created };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [cleanPath],
  );

  const update = useCallback(
    async (id, payload) => {
      setLoading(true);
      setError(null);
      try {
        const updated = await retryRequest(() =>
          api.patch(`${cleanPath}/${id}`, payload),
        );
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item)),
        );
        return { success: true, data: updated };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [cleanPath],
  );

  const remove = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        await retryRequest(() => api.delete(`${cleanPath}/${id}`));
        setItems((prev) => prev.filter((item) => item.id !== id));
        return { success: true };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [cleanPath],
  );

  const clear = useCallback(() => {
    setItems([]);
    setError(null);
  }, []);

  return {
    items,
    loading,
    error,
    fetchAll,
    fetchOne,
    create,
    update,
    remove,
    clear,
  };
}
