/**
 * Dashboard Metrics — Pure functions that compute admin dashboard statistics
 * from raw entity arrays. No side effects, no imports from React.
 *
 * These functions accept pre-fetched arrays (or mock data arrays) and return
 * derived counts and slices for the dashboard view layer.
 */

/**
 * Compute the four headline stat-card values.
 * @param {Object} data
 * @param {Array} data.users
 * @param {Array} data.subscriptions
 * @param {Array} data.classes
 * @param {Array} data.bookings
 * @returns {{ totalMembers: number, activeSubscriptions: number, scheduledClasses: number, totalBookings: number }}
 */
export function computeStats({
  users = [],
  subscriptions = [],
  classes = [],
  bookings = [],
} = {}) {
  const totalMembers = users.filter(
    (u) => u.role === 'MEMBER'
  ).length;

  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === 'ACTIVE' && s.isCurrentlyValid
  ).length;

  const scheduledClasses = classes.filter(
    (c) => c.status === 'SCHEDULED'
  ).length;

  const totalBookings = bookings.filter(
    (b) => b.status === 'BOOKED'
  ).length;

  return { totalMembers, activeSubscriptions, scheduledClasses, totalBookings };
}

/**
 * Return the most recently created members (by createdAt), limited to `count`.
 * @param {Array} [users=[]]
 * @param {number} [count=5]
 * @returns {Array}
 */
export function getRecentMembers(users = [], count = 5) {
  return users
    .filter((u) => u.role === 'MEMBER')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, count);
}

/**
 * Return the next upcoming scheduled classes sorted by date/time, limited to `count`.
 * @param {Array} [classes=[]]
 * @param {number} [count=5]
 * @returns {Array}
 */
export function getUpcomingClasses(classes = [], count = 5) {
  return classes
    .filter((c) => c.status === 'SCHEDULED')
    .sort((a, b) => {
      const dateCompare = (a.classDate || '').localeCompare(b.classDate || '');
      if (dateCompare !== 0) return dateCompare;
      return (a.startTime || '').localeCompare(b.startTime || '');
    })
    .slice(0, count);
}
