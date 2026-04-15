import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ChangePassword from "./pages/ChangePassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Menu from "./pages/Menu";
import Attendance from "./pages/Attendance";
import Billing from "./pages/Billing";
import Inventory from "./pages/Inventory";
import Complaints from "./pages/Complaints";
import Notifications from "./pages/Notifications";
import AdminUsers from "./pages/AdminUsers";
import HelpCentre from "./pages/HelpCentre";

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>

        {/* REDIRECT */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Staff", "User"]}>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        {/* MAIN APP */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >

          {/* DASHBOARD */}
          <Route
            index
            element={
              <ProtectedRoute allowedRoles={["Admin", "Staff", "User"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* COMMON */}
          <Route
            path="profile"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Staff", "User"]}>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="menu"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Staff", "User"]}>
                <Menu />
              </ProtectedRoute>
            }
          />

          <Route
            path="attendance"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Staff", "User"]}>
                <Attendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="complaints"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Staff", "User"]}>
                <Complaints />
              </ProtectedRoute>
            }
          />

          <Route
            path="notifications"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Staff", "User"]}>
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="billing"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Staff", "User"]}>
                <Billing />
              </ProtectedRoute>
            }
          />

          <Route
            path="help-centre"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Staff", "User"]}>
                <HelpCentre />
              </ProtectedRoute>
            }
          />

          {/* ADMIN / STAFF ONLY */}
          <Route
            path="inventory"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Staff"]}>
                <Inventory />
              </ProtectedRoute>
            }
          />

          <Route
            path="admin-users"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Staff"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="container">
              <div className="card">404 - Page Not Found</div>
            </div>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}