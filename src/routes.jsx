import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App"; // The Provider wrapper we built
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
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <AppShell />,
        children: [
          // 1. PUBLIC LANDING / AUTH
          { path: "login", element: <LoginPage /> },
          { path: "signup", element: <SignupPage /> },

          // 2. MEMBER PROTECTED ZONE
          {
            element: <ProtectedRoute />,
            children: [
              { index: true, element: <HomePage /> }, // Dashboard
              { path: "reservations", element: <ReservationsPage /> },
              { path: "reservations/new", element: <NewReservationPage /> },
              { path: "members", element: <MembersPage /> },
              { path: "calendar", element: <CalendarPage /> },
              { path: "menu-items", element: <MenuItemsPage /> },

              // 3. STAFF & ADMIN OPS (Role-Based)
              {
                element: <AdminRoute />,
                children: [
                  { path: "admin/daily", element: <DailyPage /> },
                  { path: "ops/floor-plan", element: <FloorPlanPage /> },
                  { path: "admin/dining-rooms", element: <DiningRoomsPage /> },
                  { path: "admin/users", element: <UsersPage /> },
                  { path: "admin/permissions", element: <PermissionsPage /> },
                ],
              },

              // DEV TOOLS
              { path: "ide", element: <IdePage /> },
              { path: "data", element: <DataView /> },
            ],
          },

          // 4. CATCH-ALL REDIRECT
          { path: "*", element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);
