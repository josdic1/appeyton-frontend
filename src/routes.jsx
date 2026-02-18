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
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },

      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "reservations", element: <ReservationsPage /> },
          { path: "reservations/new", element: <NewReservationPage /> },
          { path: "members", element: <MembersPage /> },
          { path: "calendar", element: <CalendarPage /> },

          // PUBLICLY ACCESSIBLE DIGITAL MENU [cite: 2026-02-18]
          { path: "menu-items", element: <MenuItemsPage /> },

          { path: "ide", element: <IdePage /> },
          { path: "data", element: <DataView /> },

          // Admin & Operations Only
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
        ],
      },
    ],
  },
]);
