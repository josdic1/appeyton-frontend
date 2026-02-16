// src/providers/DataProvider.jsx
import {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { DataContext } from "../contexts/DataContext";
import { AuthContext } from "../contexts/AuthContext";
import { api, retryRequest } from "../utils/api";
import { safe, asArrayOfObjects } from "../utils/safe";

const CACHE_TTL_MS = 5 * 60 * 1000;

export function DataProvider({ children }) {
  const { user, loading: authLoading } = useContext(AuthContext);
  const loggedIn = !!user;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [entities, setEntities] = useState([]);

  // Ref to prevent multiple simultaneous "refresh/bootstrap" calls
  const isFetching = useRef(false);

  const cacheKey = useMemo(
    () => (user?.id ? `bagger_cache_u${user.id}` : null),
    [user?.id],
  );

  const writeCache = useCallback(
    (nextEntities) => {
      if (!cacheKey) return;
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ entities: asArrayOfObjects(nextEntities) }),
        );
        localStorage.setItem(`${cacheKey}_time`, String(Date.now()));
      } catch (e) {
        console.error("Cache write failed", e);
      }
    },
    [cacheKey],
  );

  const readCache = useCallback(() => {
    if (!cacheKey) return null;

    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}_time`);
    if (!cachedData || !cacheTime) return null;

    const age = Date.now() - Number(cacheTime);
    if (Number.isNaN(age) || age > CACHE_TTL_MS) return null;

    try {
      const parsed = JSON.parse(cachedData);
      return {
        entities: asArrayOfObjects(parsed?.entities),
      };
    } catch {
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(`${cacheKey}_time`);
      return null;
    }
  }, [cacheKey]);

  const clearCache = useCallback(() => {
    if (!cacheKey) return;
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}_time`);
  }, [cacheKey]);

  // Fixed the setPlatforms/setEntities naming mismatch
  const applyBootstrap = useCallback((data) => {
    const nextEntities = asArrayOfObjects(data?.entities);
    setEntities(nextEntities);
    return { nextEntities };
  }, []);

  const bootstrap = useCallback(async () => {
    if (!loggedIn || isFetching.current) return;
    isFetching.current = true;
    setError(null);

    const cached = readCache();
    if (cached) {
      setEntities(cached.entities);
      setLoading(false);
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await retryRequest(() => api.get("/api/users/bootstrap"));
      const { nextEntities } = applyBootstrap(data);
      writeCache(nextEntities); // Fixed the variable typo here
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetching.current = false;
    }
  }, [loggedIn, readCache, applyBootstrap, writeCache]);

  const refresh = useCallback(async () => {
    if (!loggedIn || isFetching.current) return;
    isFetching.current = true;
    setRefreshing(true);

    try {
      const data = await retryRequest(() => api.get("/api/users/bootstrap"));
      const { nextEntities } = applyBootstrap(data);
      writeCache(nextEntities); // Added cache write on refresh
    } catch (err) {
      setError(err);
    } finally {
      setRefreshing(false);
      isFetching.current = false;
    }
  }, [loggedIn, applyBootstrap, writeCache]);

  useEffect(() => {
    if (authLoading) return;

    if (!loggedIn) {
      clearCache();
      setEntities([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    bootstrap();
  }, [authLoading, loggedIn, bootstrap, clearCache]);

  const createEntity = useCallback(
    async (data) => {
      try {
        await retryRequest(() => api.post("/api/entities/", data));
        await refresh();
      } catch (err) {
        setError(err);
        throw err; // Allow form to handle local error state
      }
    },
    [refresh],
  );

  const updateEntity = useCallback(
    async (entityId, updates) => {
      try {
        await retryRequest(() =>
          api.patch(`/api/entities/${entityId}`, updates),
        );
        setEntities((prev) => {
          const next = prev.map((e) =>
            e.id === entityId ? { ...e, ...updates } : e,
          );
          writeCache(next); // Keep cache synced with local updates
          return next;
        });
      } catch (err) {
        setError(err);
      }
    },
    [writeCache],
  );

  const deleteEntity = useCallback(
    async (entityId) => {
      try {
        await retryRequest(() => api.delete(`/api/entities/${entityId}`));
        setEntities((prev) => {
          const next = prev.filter((e) => e.id !== entityId);
          writeCache(next); // Keep cache synced
          return next;
        });
      } catch (err) {
        setError(err);
      }
    },
    [writeCache],
  );

  const value = useMemo(
    () => ({
      loading,
      refreshing,
      entities,
      createEntity,
      updateEntity,
      deleteEntity,
      bootstrap,
      refresh,
      clearCache,
      error,
    }),
    [
      loading,
      refreshing,
      entities,
      createEntity,
      updateEntity,
      deleteEntity,
      bootstrap,
      refresh,
      clearCache,
      error,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
