import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./components/shared/AppShell";
import { CalendarPage } from "./pages/CalendarPage";
import { HomePage } from "./pages/HomePage";
import { IdePage } from "./pages/IdePage";
import { DataView } from "./components/shared/DataView";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ErrorPage } from "./pages/ErrorPage";
import { ProtectedRoute } from "./components/shared/ProtectedRoute";
import { UsersPage } from "./pages/admin/UsersPage";
import { DiningRoomsPage } from "./pages/admin/DiningRoomsPage";
import { MenuItemsPage } from "./pages/admin/MenuItemsPage";

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
          { path: "ide", element: <IdePage /> },
          { path: "data", element: <DataView /> },
          { path: "calendar", element: <CalendarPage /> },
          { path: "users", element: <UsersPage /> },
          { path: "dining-rooms", element: <DiningRoomsPage /> },
          { path: "menu-items", element: <MenuItemsPage /> },
        ],
      },
    ],
  },
]);
