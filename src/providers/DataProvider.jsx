// src/providers/DataProvider.jsx
// FIX #7: fetchTables had two dead variables (allTables, roomsData) and was
// fetching /api/ops/dining-rooms for no reason before hitting /api/ops/tables.
// Removed both. Single clean fetch.
import { useState, useContext, useCallback, useMemo } from "react";
import { DataContext } from "../contexts/DataContext";
import { AuthContext } from "../contexts/AuthContext";
import { api, retryRequest } from "../utils/api";

export function DataProvider({ children }) {
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncType, setSyncType] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const fetchRooms = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await retryRequest(() => api.get("/api/ops/dining-rooms"));
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTables = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // FIXED: was fetching dining-rooms first (unused) then tables — now just tables
      const data = await retryRequest(() => api.get("/api/ops/tables"));
      setTables(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchReservations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await retryRequest(() => api.get("/api/ops/reservations"));
      setReservations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMenuItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await retryRequest(() => api.get("/api/menu-items"));
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createReservation = useCallback(async (reservationData) => {
    try {
      const newReservation = await retryRequest(() =>
        api.post("/api/reservations", reservationData),
      );
      setReservations((prev) => [...prev, newReservation]);
      return { success: true, data: newReservation };
    } catch (err) {
      setError(err);
      return { success: false, error: err.message };
    }
  }, []);

  const updateReservation = useCallback(async (reservationId, updates) => {
    try {
      const updated = await retryRequest(() =>
        api.patch(`/api/reservations/${reservationId}`, updates),
      );
      setReservations((prev) =>
        prev.map((r) => (r.id === reservationId ? updated : r)),
      );
      return { success: true, data: updated };
    } catch (err) {
      setError(err);
      return { success: false, error: err.message };
    }
  }, []);

  const deleteReservation = useCallback(async (reservationId) => {
    try {
      await retryRequest(() =>
        api.delete(`/api/reservations/${reservationId}`),
      );
      setReservations((prev) => prev.filter((r) => r.id !== reservationId));
      return { success: true };
    } catch (err) {
      setError(err);
      return { success: false, error: err.message };
    }
  }, []);

  const value = useMemo(
    () => ({
      loading,
      error,
      refreshing,
      setRefreshing,
      syncType,
      setSyncType,
      rooms,
      tables,
      reservations,
      menuItems,
      fetchRooms,
      fetchTables,
      fetchReservations,
      fetchMenuItems,
      createReservation,
      updateReservation,
      deleteReservation,
    }),
    [
      loading,
      error,
      refreshing,
      syncType,
      rooms,
      tables,
      reservations,
      menuItems,
      fetchRooms,
      fetchTables,
      fetchReservations,
      fetchMenuItems,
      createReservation,
      updateReservation,
      deleteReservation,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
