import { useState, useContext, useCallback, useMemo } from "react";
import { DataContext } from "../contexts/DataContext";
import { AuthContext } from "../contexts/AuthContext";
import { api, retryRequest } from "../utils/api";
import { safe } from "../utils/safe";

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

  const performSync = useCallback(
    async (type, fetchFn, setter) => {
      if (!user) return;
      setSyncType(type);
      setRefreshing(true);
      try {
        const response = await retryRequest(fetchFn);
        const payload = response?.data?.data || response?.data || response;
        setter(safe.array(payload));
        setError(null);
      } catch (err) {
        console.error(`Sync Error [${type}]:`, err);
        setError(err);
      } finally {
        setRefreshing(false);
        setSyncType(null);
      }
    },
    [user],
  );

  // FIXED: Removed /ops/ prefixes
  const fetchRooms = useCallback(
    () => performSync("rooms", () => api.get("/dining-rooms"), setRooms),
    [performSync],
  );

  const fetchTables = useCallback(
    () => performSync("tables", () => api.get("/tables"), setTables),
    [performSync],
  );

  const fetchReservations = useCallback(
    () =>
      performSync(
        "reservations",
        () => api.get("/reservations"),
        setReservations,
      ),
    [performSync],
  );

  const fetchMenuItems = useCallback(
    () => performSync("menu", () => api.get("/menu-items"), setMenuItems),
    [performSync],
  );

  const createReservation = useCallback(async (reservationData) => {
    try {
      const response = await retryRequest(() =>
        api.post("/reservations", reservationData),
      );
      const newRes = response?.data?.data || response?.data || response;
      setReservations((prev) => [...prev, newRes]);
      return { success: true, data: newRes };
    } catch (err) {
      setError(err);
      return { success: false, error: err.message };
    }
  }, []);

  const updateReservation = useCallback(async (id, updates) => {
    try {
      const response = await retryRequest(() =>
        api.patch(`/reservations/${id}`, updates),
      );
      const updated = response?.data?.data || response?.data || response;
      setReservations((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return { success: true, data: updated };
    } catch (err) {
      setError(err);
      return { success: false, error: err.message };
    }
  }, []);

  const deleteReservation = useCallback(async (id) => {
    try {
      await retryRequest(() => api.delete(`/reservations/${id}`));
      setReservations((prev) => prev.filter((r) => r.id !== id));
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
