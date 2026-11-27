import React from 'react';
import './StatusBadge.css';

/**
 * Map of known statuses to CSS modifier classes.
 */
const STATUS_VARIANTS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BOOKED: 'booked',
  CANCELLED: 'cancelled',
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  PAID: 'paid',
};

/**
 * StatusBadge — Colored pill indicating entity status.
 * @param {Object} props
 * @param {string} props.status - The status value (e.g. "ACTIVE", "CANCELLED")
 */
export function StatusBadge({ status }) {
  const normalized = (status || '').toUpperCase();
  const variant = STATUS_VARIANTS[normalized] || 'default';

  return (
    <span className={`status-badge status-badge--${variant}`}>
      {status}
    </span>
  );
}

export default StatusBadge;
