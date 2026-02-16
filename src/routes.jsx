import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./components/shared/AppShell";
import { CalendarPage } from "./pages/CalendarPage";
import {HomePage} from "./pages/HomePage";
import { IdePage } from "./pages/IdePage";
import { DataView } from "./components/shared/DataView";
import {LoginPage} from "./pages/LoginPage";
import { ErrorPage } from "./pages/ErrorPage";
import { ProtectedRoute } from "./components/shared/ProtectedRoute";

export const routes = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <ErrorPage />,
    children: [
      { path: "login", element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "ide", element: <IdePage /> },
          { path: "data", element: <DataView /> },
           { path: "calendar", element: <CalendarPage /> },
        ]
      }
    ]
  }
]);