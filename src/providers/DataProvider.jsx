// src/providers/DataProvider.jsx
import { useState, useContext, useCallback, useMemo } from "react";
import { DataContext } from "../contexts/DataContext";
import { AuthContext } from "../contexts/AuthContext";
import { api, retryRequest } from "../utils/api";

export function DataProvider({ children }) {
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sterling Catering data
  const [rooms, setRooms] = useState([]);
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // Fetch dining rooms
  const fetchRooms = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await retryRequest(() => api.get("/api/dining-rooms"));
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch all tables
  const fetchTables = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch tables for each room and combine
      const roomsData = await retryRequest(() => api.get("/api/dining-rooms"));
      const allTables = [];

      for (const room of roomsData) {
        const tablesData = await retryRequest(() =>
          api.get(`/api/dining-rooms/${room.id}/tables`),
        );
        allTables.push(...(Array.isArray(tablesData) ? tablesData : []));
      }

      setTables(allTables);
    } catch (err) {
      setError(err);
      console.error("Failed to fetch tables:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch reservations
  const fetchReservations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await retryRequest(() => api.get("/api/reservations"));
      setReservations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
      console.error("Failed to fetch reservations:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch menu items
  const fetchMenuItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await retryRequest(() => api.get("/api/menu-items"));
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
      console.error("Failed to fetch menu items:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create reservation
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

  // Update reservation
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

  // Delete reservation
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
      // Data
      rooms,
      tables,
      reservations,
      menuItems,
      // Fetch methods
      fetchRooms,
      fetchTables,
      fetchReservations,
      fetchMenuItems,
      // CRUD methods
      createReservation,
      updateReservation,
      deleteReservation,
    }),
    [
      loading,
      error,
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
