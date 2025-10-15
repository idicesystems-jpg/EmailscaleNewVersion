// ProtectedRoute.jsx
import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const auth = useSelector((state) => state.auth);

  // Not logged in
  if (!auth || !auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Role not allowed
  if (!allowedRoles.includes(auth.user.role_id)) {
    return <Navigate to="/dashboard" replace />;
  }

   // Render the component
  return children;
};

export default ProtectedRoute;
