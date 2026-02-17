import { useState, useContext, useCallback, useMemo } from "react";
import { DataContext } from "../contexts/DataContext";
import { AuthContext } from "../contexts/AuthContext";
import { api, retryRequest } from "../utils/api";

export function DataProvider({ children }) {
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🛡️ Sync/Refresh states for indicators
  const [refreshing, setRefreshing] = useState(false);
  const [syncType, setSyncType] = useState(null);

  // Sterling Catering data
  const [rooms, setRooms] = useState([]);
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // Fetch dining rooms (Updated to /api/ops/)
  const fetchRooms = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await retryRequest(() => api.get("/api/ops/dining-rooms"));
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch all tables (Updated to /api/ops/)
  const fetchTables = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get rooms from ops list first
      const roomsData = await retryRequest(() =>
        api.get("/api/ops/dining-rooms"),
      );
      const allTables = [];

      // We use the master tables list in ops instead of looping room by room
      const tablesData = await retryRequest(() => api.get("/api/ops/tables"));
      setTables(Array.isArray(tablesData) ? tablesData : []);
    } catch (err) {
      setError(err);
      console.error("Failed to fetch tables:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch reservations (Updated to /api/ops/)
  const fetchReservations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await retryRequest(() => api.get("/api/ops/reservations"));
      setReservations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
      console.error("Failed to fetch reservations:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch menu items (Remains at /api/menu-items as it is public-read)
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
