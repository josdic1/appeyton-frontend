import { createContext } from "react";

/**
 * DataContext holds the core business entities.
 * rooms: Array of dining room objects
 * menu: Array of menu items
 * tables: Array of all table entities
 * refresh: Function to force-reload all data from the server
 */
export const DataContext = createContext(null);
