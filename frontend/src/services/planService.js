import { apiRequest } from './api';

/**
 * Membership Plan Service
 * - Public active membership plans (/plans)
 * - Administrative membership plan CRUD (/plans/*)
 * Reference: docs/API_CONTRACT.md Section 7
 */
export const planService = {
  // Public & Admin Listings
  getPlans: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/plans?${query}` : '/plans';
    return apiRequest(endpoint);
  },
  getPublicPlans: async () => {
    return apiRequest('/plans');
  },
  getPlanById: async (id) => {
    return apiRequest(`/plans/${id}`);
  },

  // Admin Management
  createPlan: async (planData) => {
    return apiRequest('/plans', {
      method: 'POST',
      body: JSON.stringify(planData)
    });
  },
  updatePlan: async (id, planData) => {
    return apiRequest(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(planData)
    });
  },
  updatePlanStatus: async (id, isActive) => {
    return apiRequest(`/plans/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive })
    });
  },
  deletePlan: async (id) => {
    return apiRequest(`/plans/${id}`, {
      method: 'DELETE'
    });
  }
};

export default planService;
