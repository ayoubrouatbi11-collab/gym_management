import React from 'react';
import StatusBadge from '../../../components/common/StatusBadge';

/**
 * UpcomingClassesCard — Displays a table of the next upcoming scheduled classes.
 * @param {Object} props
 * @param {Array} props.classes - Array of upcoming class objects
 * @param {boolean} [props.loading=false]
 */
export function UpcomingClassesCard({ classes, loading = false }) {
  if (loading) {
    return (
      <div className="dashboard-card">
        <h3 className="dashboard-card__title">Upcoming Classes</h3>
        <p className="dashboard-card__empty">Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <h3 className="dashboard-card__title">Upcoming Classes</h3>
      {classes.length === 0 ? (
        <p className="dashboard-card__empty">No upcoming classes scheduled.</p>
      ) : (
        <div className="dashboard-card__table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Trainer</th>
                <th>Date</th>
                <th>Time</th>
                <th>Capacity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id}>
                  <td>{cls.name}</td>
                  <td>{cls.trainerName}</td>
                  <td>{formatClassDate(cls.classDate)}</td>
                  <td>{formatTime(cls.startTime)} – {formatTime(cls.endTime)}</td>
                  <td>
                    <span className="capacity-indicator">
                      {cls.activeBookingsCount}/{cls.capacity}
                    </span>
                  </td>
                  <td><StatusBadge status={cls.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Format a YYYY-MM-DD date string to a short readable form.
 * @param {string} dateStr
 * @returns {string}
 */
function formatClassDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format HH:mm:ss to HH:mm for display.
 * @param {string} timeStr
 * @returns {string}
 */
function formatTime(timeStr) {
  if (!timeStr) return '—';
  return timeStr.substring(0, 5);
}

export default UpcomingClassesCard;
