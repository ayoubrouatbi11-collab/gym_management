/**
 * Admin Dashboard Service
 *
 * Abstracts the data-fetching layer for the admin dashboard.
 * Currently returns mock data wrapped in Promises.
 * When the backend is ready, replace the mock imports with real service calls:
 *   import { userService } from '../../../services/userService';
 *   import { subscriptionService } from '../../../services/subscriptionService';
 *   ...
 *
 * Components and hooks import ONLY this service — never the mock data module.
 */
import {
  mockUsers,
  mockSubscriptions,
  mockClasses,
  mockBookings,
} from '../mocks/adminDashboardMockData';

const MOCK_DELAY_MS = 300;

/**
 * Simulate an async fetch with a small delay.
 * @template T
 * @param {T} data
 * @returns {Promise<T>}
 */
function simulateFetch(data) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), MOCK_DELAY_MS);
  });
}

/**
 * Fetch all data needed for the admin dashboard in parallel.
 * Returns the same shapes as the real API service calls.
 * @returns {Promise<{ users: Array, subscriptions: Array, classes: Array, bookings: Array }>}
 */
export async function fetchDashboardData() {
  // TODO: Replace with real API calls when backend is available:
  // const [users, subscriptions, classes, bookings] = await Promise.all([
  //   userService.getAllUsers({ role: 'ALL' }),
  //   subscriptionService.getAllSubscriptions(),
  //   classService.getClasses({ status: 'ALL', includePast: 'true' }),
  //   bookingService.getAllBookings(),
  // ]);
  const [users, subscriptions, classes, bookings] = await Promise.all([
    simulateFetch(mockUsers),
    simulateFetch(mockSubscriptions),
    simulateFetch(mockClasses),
    simulateFetch(mockBookings),
  ]);

  return { users, subscriptions, classes, bookings };
}
