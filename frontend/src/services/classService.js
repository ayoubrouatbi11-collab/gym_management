import { apiRequest } from './api';

/**
 * Gym Class Service
 * - Public / Member scheduled classes (/classes)
 * - Administrative gym class CRUD and status updates (/classes/*)
 * Reference: docs/API_CONTRACT.md Section 10
 */
export const classService = {
  // Public, Member & Admin Listings
  getClasses: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/classes?${query}` : '/classes';
    return apiRequest(endpoint);
  },
  getPublicClasses: async () => {
    return apiRequest('/classes');
  },
  getClassById: async (id) => {
    return apiRequest(`/classes/${id}`);
  },

  // Admin Management
  createClass: async (classData) => {
    return apiRequest('/classes', {
      method: 'POST',
      body: JSON.stringify(classData)
    });
  },
  updateClass: async (id, classData) => {
    return apiRequest(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(classData)
    });
  },
  cancelClass: async (id) => {
    return apiRequest(`/classes/${id}/cancel`, {
      method: 'PUT'
    });
  },
  completeClass: async (id) => {
    return apiRequest(`/classes/${id}/complete`, {
      method: 'PUT'
    });
  }
};

export default classService;
