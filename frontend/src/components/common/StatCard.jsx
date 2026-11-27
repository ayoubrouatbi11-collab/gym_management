import React from 'react';
import './StatCard.css';

/**
 * StatCard — Reusable metric display card for dashboards.
 * @param {Object} props
 * @param {string} props.label - Metric description (e.g. "Total Members")
 * @param {string|number} props.value - Metric value to display
 * @param {string} [props.icon] - Emoji or text icon
 * @param {string} [props.accentColor] - CSS color for the icon background
 * @param {boolean} [props.loading=false] - Show skeleton loading state
 */
export function StatCard({ label, value, icon, accentColor = 'var(--color-info-bg)', loading = false }) {
  const cardClass = `stat-card${loading ? ' stat-card--loading' : ''}`;

  return (
    <div
      className={cardClass}
      aria-busy={loading}
      aria-label={loading ? `Loading ${label}` : undefined}
    >
      {icon && (
        <div
          className="stat-card__icon"
          style={{ backgroundColor: accentColor }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <div className="stat-card__content">
        <span className="stat-card__value">{loading ? '' : value}</span>
        <span className="stat-card__label">{loading ? '' : label}</span>
      </div>
    </div>
  );
}

export default StatCard;
