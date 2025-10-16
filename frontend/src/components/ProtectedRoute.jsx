// ProtectedRoute.jsx
import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role_id))
    return <Navigate to="/dashboard" replace />;

  return children;
};

export default ProtectedRoute;
