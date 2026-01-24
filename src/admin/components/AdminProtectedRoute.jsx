/**
 * Admin Protected Route Component
 * Ensures user is authenticated as super admin before accessing routes
 */
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuthStore } from '../stores/adminAuthStore';

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, checkAuth } = useAdminAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
