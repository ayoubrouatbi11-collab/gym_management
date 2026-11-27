import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoutes from './routes/AdminRoutes';

/**
 * FitSphere — Application Root Entry Point
 *
 * Top-level route configuration. Each developer's route tree is
 * mounted under its own path prefix:
 *   /admin/*   → Developer 2 (Administrator)
 *   /member/*  → Developer 3 (Member)        — not yet implemented
 *   /          → Developer 1 (Visitor/Public) — not yet implemented
 *
 * Auth guard: /admin/* requires an authenticated ADMIN session.
 * When no backend is running, AuthContext sets user=null and
 * ProtectedRoute redirects to /login until backend auth (AUTH-02)
 * and the public login UI (VIS-09) are integrated.
 */
function App() {
  return (
    <Routes>
      {/* Admin routes — protected, ADMIN role required */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminRoutes />
          </ProtectedRoute>
        }
      />

      {/* Placeholder login page — will be implemented by Developer 1 */}
      <Route path="/login" element={<LoginPlaceholder />} />

      {/* Placeholder home page — will be implemented by Developer 1 */}
      <Route path="/" element={<HomePlaceholder />} />

      {/* Catch-all — redirect unknown paths to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * LoginPlaceholder — Temporary stub until Developer 1 implements the login page.
 * Prevents ProtectedRoute's redirect to /login from producing a blank page.
 */
function LoginPlaceholder() {
  return (
    <div style={{
      maxWidth: '400px',
      margin: '120px auto',
      padding: '32px',
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-md)',
      textAlign: 'center',
    }}>
      <h1 style={{ color: 'var(--color-primary)', marginBottom: '12px', fontSize: '1.75rem' }}>
        FitSphere
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
        Login page — awaiting implementation by Developer 1.
      </p>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        Start the backend server and navigate to <code>/admin</code> to access the admin dashboard.
      </p>
    </div>
  );
}

/**
 * HomePlaceholder — Temporary stub until Developer 1 implements the public home page.
 */
function HomePlaceholder() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '80px auto',
      padding: '32px',
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-md)',
      textAlign: 'center',
    }}>
      <h1 style={{ color: 'var(--color-primary)', marginBottom: '12px', fontSize: '2.25rem' }}>
        FitSphere
      </h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '24px' }}>
        Gym Management Platform — Project Environment Initialized
      </p>
      <div style={{
        padding: '16px',
        backgroundColor: '#f1f5f9',
        borderRadius: '6px',
        display: 'inline-block',
        textAlign: 'left',
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Project Roles & Full-Stack Ownership:</div>
        <ul style={{ paddingLeft: '20px', color: '#334155' }}>
          <li><strong>Member 1:</strong> Visitor / Public Experience</li>
          <li><strong>Member 2:</strong> Administrator Management</li>
          <li><strong>Member 3:</strong> Member Dashboard & Bookings</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
