// Create src/hooks/useOnline.jsx
import { useState, useEffect } from "react";

export function useOnline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

// Use in DataProvider:
const isOnline = useOnline();

useEffect(() => {
  if (!isOnline) {
    // Show offline banner
    console.warn("You are offline. Some features may not work.");
  }
}, [isOnline]);
