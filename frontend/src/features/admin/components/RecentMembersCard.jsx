import React from 'react';
import StatusBadge from '../../../components/common/StatusBadge';

/**
 * RecentMembersCard — Displays a table of the most recently registered members.
 * @param {Object} props
 * @param {Array} props.members - Array of recent user objects
 * @param {boolean} [props.loading=false]
 */
export function RecentMembersCard({ members, loading = false }) {
  if (loading) {
    return (
      <div className="dashboard-card">
        <h3 className="dashboard-card__title">Recent Members</h3>
        <p className="dashboard-card__empty">Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <h3 className="dashboard-card__title">Recent Members</h3>
      {members.length === 0 ? (
        <p className="dashboard-card__empty">No members registered yet.</p>
      ) : (
        <div className="dashboard-card__table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>{member.fullName}</td>
                  <td>{member.email}</td>
                  <td><StatusBadge status={member.accountStatus} /></td>
                  <td>{formatDate(member.createdAt)}</td>
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
 * Format an ISO timestamp to a short readable date string.
 * @param {string} isoString
 * @returns {string}
 */
function formatDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default RecentMembersCard;
