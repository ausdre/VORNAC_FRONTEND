/**
 * Admin App Router
 * Main router for super admin portal
 * Handles authentication and routes
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuthStore } from './stores/adminAuthStore';
import Toast from '../components/Toast';

// Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import TenantsPage from './pages/TenantsPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';
import AccessLogsPage from './pages/AccessLogsPage';
import SSOConfigPage from './pages/SSOConfigPage';
import KMSConfigPage from './pages/KMSConfigPage';
import AdminSettingsPage from './pages/AdminSettingsPage';

// Components
import AdminLayout from './components/AdminLayout';
import AdminProtectedRoute from './components/AdminProtectedRoute';

const AdminApp = () => {
  const { isAuthenticated } = useAdminAuthStore();

  if (!isAuthenticated) {
    return (
      <>
        <Toast />
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <Toast />
      <AdminLayout>
        <Routes>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/tenants"
          element={
            <AdminProtectedRoute>
              <TenantsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminProtectedRoute>
              <UsersPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <AdminProtectedRoute>
              <AuditLogsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/access-logs"
          element={
            <AdminProtectedRoute>
              <AccessLogsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/sso"
          element={
            <AdminProtectedRoute>
              <SSOConfigPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/kms"
          element={
            <AdminProtectedRoute>
              <KMSConfigPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminProtectedRoute>
              <AdminSettingsPage />
            </AdminProtectedRoute>
          }
        />
        <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminLayout>
    </>
  );
};

export default AdminApp;
