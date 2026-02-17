import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./components/shared/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { HomePage } from "./pages/HomePage";
import { IdePage } from "./pages/IdePage";
import { DataView } from "./components/shared/DataView";
import { CalendarPage } from "./pages/CalendarPage";
import { MenuItemsPage } from "./pages/admin/MenuItemsPage";
import { DiningRoomsPage } from "./pages/admin/DiningRoomsPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { PermissionsPage } from "./pages/PermissionsPage";
import { ErrorPage } from "./pages/ErrorPage";

// Guards
import { ProtectedRoute } from "./components/shared/ProtectedRoute";
import { AdminRoute } from "./components/shared/AdminRoute";

export const routes = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <ErrorPage />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      {
        // LEVEL 1: Must be logged in (Member, Staff, OR Admin)
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "ide", element: <IdePage /> },
          { path: "data", element: <DataView /> },
          { path: "calendar", element: <CalendarPage /> },
          { path: "menu-items", element: <MenuItemsPage /> },
          { path: "dining-rooms", element: <DiningRoomsPage /> },

          {
            // LEVEL 2: Must be logged in AND have 'admin' role
            element: <AdminRoute />,
            children: [
              { path: "users", element: <UsersPage /> },
              { path: "permissions", element: <PermissionsPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
