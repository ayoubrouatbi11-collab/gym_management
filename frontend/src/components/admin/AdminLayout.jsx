import React, { useState, useCallback, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

/**
 * Navigation items for the admin sidebar.
 * Each entry maps to a future admin route.
 */
const NAV_ITEMS = [
  { to: '/admin',          icon: '📊', label: 'Dashboard',        end: true },
  { to: '/admin/members',  icon: '👥', label: 'Members',          end: false },
  { to: '/admin/trainers', icon: '🏋️', label: 'Trainers',         end: false },
  { to: '/admin/plans',    icon: '📋', label: 'Membership Plans', end: false },
  { to: '/admin/subscriptions', icon: '🔄', label: 'Subscriptions', end: false },
  { to: '/admin/payments', icon: '💳', label: 'Payments',         end: false },
  { to: '/admin/classes',  icon: '📅', label: 'Classes',          end: false },
  { to: '/admin/bookings', icon: '🎫', label: 'Bookings',         end: false },
];

/**
 * AdminLayout — Shell layout for all /admin/* routes.
 * Provides a fixed sidebar with navigation and a top header bar.
 * Renders child routes via <Outlet />.
 */
export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeNav = NAV_ITEMS.find((item) =>
    item.end
      ? location.pathname === item.to || location.pathname === `${item.to}/`
      : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
  );
  const pageTitle = activeNav ? activeNav.label : 'Administration';

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const userInitial = user?.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : 'A';

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      <div
        className={`admin-sidebar-overlay${sidebarOpen ? ' admin-sidebar-overlay--visible' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={`admin-sidebar${sidebarOpen ? ' admin-sidebar--open' : ''}`}
      >
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__brand-icon" aria-hidden="true">💪</span>
          FitSphere Admin
        </div>
        <nav className="admin-sidebar__nav" aria-label="Admin navigation">
          <ul className="admin-sidebar__nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.to} className="admin-sidebar__nav-item">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `admin-sidebar__nav-link${isActive ? ' admin-sidebar__nav-link--active' : ''}`
                  }
                  onClick={closeSidebar}
                >
                  <span className="admin-sidebar__nav-icon" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header__left">
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={sidebarOpen}
              aria-controls="admin-sidebar"
            >
              ☰
            </button>
            <h1 className="admin-header__title">{pageTitle}</h1>
          </div>
          <div className="admin-header__actions">
            <div className="admin-header__user">
              <div className="admin-header__avatar">{userInitial}</div>
              <span>{user?.fullName || 'Admin'}</span>
            </div>
            <button
              type="button"
              className="admin-header__logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
