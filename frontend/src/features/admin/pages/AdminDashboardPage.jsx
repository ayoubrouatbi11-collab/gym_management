import React from 'react';
import StatCard from '../../../components/common/StatCard';
import RecentMembersCard from '../components/RecentMembersCard';
import UpcomingClassesCard from '../components/UpcomingClassesCard';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import './AdminDashboardPage.css';

/**
 * Stat-card configuration — maps computed metric keys to display props.
 * Order matches the four required dashboard metrics.
 */
const STAT_CARD_CONFIG = [
  { key: 'totalMembers',        label: 'Total Members',        icon: '👥', accentColor: 'var(--color-info-bg)' },
  { key: 'activeSubscriptions', label: 'Active Subscriptions', icon: '🔄', accentColor: 'var(--color-success-bg)' },
  { key: 'scheduledClasses',    label: 'Scheduled Classes',    icon: '📅', accentColor: 'var(--color-warning-bg)' },
  { key: 'totalBookings',       label: 'Total Bookings',       icon: '🎫', accentColor: '#fdf2f8' },
];

/**
 * AdminDashboardPage — Main dashboard view for the admin panel.
 * Renders four metric cards and two overview tables.
 */
export function AdminDashboardPage() {
  const { stats, recentMembers, upcomingClasses, loading, error, refresh } = useAdminDashboard();

  if (error) {
    return (
      <div className="dashboard-error" role="alert">
        <p className="dashboard-error__message">
          <span aria-hidden="true">⚠️</span> {error}
        </p>
        <button type="button" className="dashboard-error__retry-btn" onClick={refresh}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-header">
        <h2 className="dashboard-header__title">Overview</h2>
        <p className="dashboard-header__subtitle">
          Key gym metrics, recent members, and upcoming classes
        </p>
      </div>

      {/* Stat cards */}
      <div className="dashboard-stats-grid">
        {STAT_CARD_CONFIG.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={stats ? stats[card.key] : 0}
            icon={card.icon}
            accentColor={card.accentColor}
            loading={loading}
          />
        ))}
      </div>

      {/* Overview tables */}
      <div className="dashboard-overview-grid">
        <RecentMembersCard members={recentMembers} loading={loading} />
        <UpcomingClassesCard classes={upcomingClasses} loading={loading} />
      </div>
    </div>
  );
}

export default AdminDashboardPage;
