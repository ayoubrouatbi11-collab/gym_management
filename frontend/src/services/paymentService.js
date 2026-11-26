import { apiRequest } from './api';

/**
 * Payment Service (Owner: Member 2 — Administrator)
 * - Administrative manual payment audit and retrieval (/payments/*)
 * Note: Payment creation is coupled atomically inside:
 *   - userService.createUser (/users) for initial member creation
 *   - subscriptionService.createSubscription (/subscriptions) for renewals
 * Reference: docs/API_CONTRACT.md Section 9
 */
export const paymentService = {
  // Admin Management (Retrieval Only)
  getAllPayments: async () => {
    return apiRequest('/payments');
  },
  getPaymentById: async (id) => {
    return apiRequest(`/payments/${id}`);
  },
  getPaymentBySubscription: async (subscriptionId) => {
    return apiRequest(`/payments/subscription/${subscriptionId}`);
  }
};

export default paymentService;
