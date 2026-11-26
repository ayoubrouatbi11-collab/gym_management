import { apiRequest } from './api';

/**
 * Subscription Service
 * - Member subscription history with dynamic validity (/subscriptions/my)
 * - Administrative subscription oversight and renewals (/subscriptions/*)
 * Reference: docs/API_CONTRACT.md Section 8
 */
export const subscriptionService = {
  // Member
  getMySubscriptions: async () => {
    return apiRequest('/subscriptions/my');
  },

  // Admin Management
  getAllSubscriptions: async () => {
    return apiRequest('/subscriptions');
  },
  getSubscriptionById: async (id) => {
    return apiRequest(`/subscriptions/${id}`);
  },
  createSubscription: async (subscriptionData) => {
    return apiRequest('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData)
    });
  },
  cancelSubscription: async (id) => {
    return apiRequest(`/subscriptions/${id}/cancel`, {
      method: 'PUT'
    });
  }
};

export default subscriptionService;
