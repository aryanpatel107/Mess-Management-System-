import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn, getUser, mustChangePassword } from "../auth";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  const user = getUser();
  const forceChange = mustChangePassword();

  if (forceChange && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (!forceChange && location.pathname === "/change-password") {
    return <Navigate to="/app" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/app" replace />;
  }

  return children;
}