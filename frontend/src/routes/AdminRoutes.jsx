import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage';

/**
 * AdminRoutes — Nested route tree for all /admin/* pages.
 * Wrapped in AdminLayout which provides the sidebar and header shell.
 *
 * Future admin pages (Members, Trainers, Plans, etc.) will be added
 * as additional <Route> elements inside this tree by Developer 2.
 */
export function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        {/* Dashboard — index route */}
        <Route index element={<AdminDashboardPage />} />

        {/* Placeholder routes for future admin pages */}
        <Route path="members"       element={<PlaceholderPage title="Members Management" />} />
        <Route path="trainers"      element={<PlaceholderPage title="Trainers Management" />} />
        <Route path="plans"         element={<PlaceholderPage title="Membership Plans" />} />
        <Route path="subscriptions" element={<PlaceholderPage title="Subscriptions" />} />
        <Route path="payments"      element={<PlaceholderPage title="Payments" />} />
        <Route path="classes"       element={<PlaceholderPage title="Classes Management" />} />
        <Route path="bookings"      element={<PlaceholderPage title="Bookings" />} />

        {/* Catch-all inside /admin — redirect to dashboard */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}

/**
 * PlaceholderPage — Temporary stub for not-yet-implemented admin pages.
 * Will be replaced by real page components in later tasks (ADM-02 through ADM-08).
 */
function PlaceholderPage({ title }) {
  return (
    <div style={{
      padding: '48px 24px',
      textAlign: 'center',
      color: 'var(--color-text-muted)',
    }}>
      <h2 style={{ marginBottom: '8px', color: 'var(--color-text)' }}>{title}</h2>
      <p>This page will be implemented in a future task.</p>
    </div>
  );
}

export default AdminRoutes;
