// src/routes.jsx
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
import { FloorPlanPage } from "./pages/ops/FloorPlanPage";
import { NewReservationPage } from "./pages/NewReservationPage";
import { MembersPage } from "./pages/MembersPage";
import { ProtectedRoute } from "./components/shared/ProtectedRoute";
import { AdminRoute } from "./components/shared/AdminRoute";
import { ReservationsPage } from "./pages/ReservationsPage";
import { DailyPage } from "./pages/admin/DailyPage";

export const routes = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <ErrorPage />,
    children: [
      // Public Routes
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },

      // Logged In Users (Members, Staff, Admin)
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <HomePage /> },

          // Member / Customer Routes
          { path: "reservations", element: <ReservationsPage /> },
          { path: "reservations/new", element: <NewReservationPage /> },
          { path: "members", element: <MembersPage /> }, // Manage family members

          // Shared Utilities
          { path: "ide", element: <IdePage /> },
          { path: "data", element: <DataView /> },
          { path: "calendar", element: <CalendarPage /> },

          // ADMIN / OPERATIONS ROUTES
          // (Only Admins and Staff should reach here)
          {
            element: <AdminRoute />,
            children: [
              // Operations
              { path: "admin/daily", element: <DailyPage /> },
              { path: "ops/floor-plan", element: <FloorPlanPage /> },

              // Configuration (Updated with admin/ prefix)
              { path: "admin/menu-items", element: <MenuItemsPage /> },
              { path: "admin/dining-rooms", element: <DiningRoomsPage /> },
              { path: "admin/users", element: <UsersPage /> },
              { path: "admin/permissions", element: <PermissionsPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
