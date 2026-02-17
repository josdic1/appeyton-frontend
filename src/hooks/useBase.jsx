// src/hooks/useBase.jsx
import { useState, useCallback } from "react";
import { api, retryRequest } from "../utils/api";

/**
 * Generic CRUD hook for any base
 * @param {string} basePath - API path (e.g., 'users', 'menu-items', 'dining-rooms')
 * @returns Object with items array and CRUD methods
 */
export function useBase(basePath) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await retryRequest(() => api.get(`/api/${basePath}`));
      setItems(Array.isArray(data) ? data : []);
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      console.error(`Failed to fetch ${basePath}:`, err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  const fetchOne = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const data = await retryRequest(() =>
          api.get(`/api/${basePath}/${id}`),
        );
        return { success: true, data };
      } catch (err) {
        setError(err.message);
        console.error(`Failed to fetch ${basePath}/${id}:`, err);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [basePath],
  );

  const create = useCallback(
    async (data) => {
      setLoading(true);
      setError(null);
      try {
        const created = await retryRequest(() =>
          api.post(`/api/${basePath}`, data),
        );
        setItems((prev) => [...prev, created]);
        return { success: true, data: created };
      } catch (err) {
        setError(err.message);
        console.error(`Failed to create ${basePath}:`, err);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [basePath],
  );

  const update = useCallback(
    async (id, data) => {
      setLoading(true);
      setError(null);
      try {
        const updated = await retryRequest(() =>
          api.patch(`/api/${basePath}/${id}`, data),
        );
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item)),
        );
        return { success: true, data: updated };
      } catch (err) {
        setError(err.message);
        console.error(`Failed to update ${basePath}/${id}:`, err);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [basePath],
  );

  const remove = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        await retryRequest(() => api.delete(`/api/${basePath}/${id}`));
        setItems((prev) => prev.filter((item) => item.id !== id));
        return { success: true };
      } catch (err) {
        setError(err.message);
        console.error(`Failed to delete ${basePath}/${id}:`, err);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [basePath],
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
