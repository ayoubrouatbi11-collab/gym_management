import { apiRequest } from './api';

/**
 * Trainer Service
 * - Public active trainer listings (/trainers)
 * - Administrative trainer CRUD (/trainers/*)
 * Reference: docs/API_CONTRACT.md Section 6
 */
export const trainerService = {
  // Public & Admin Listings
  getTrainers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/trainers?${query}` : '/trainers';
    return apiRequest(endpoint);
  },
  getPublicTrainers: async () => {
    return apiRequest('/trainers');
  },
  getTrainerById: async (id) => {
    return apiRequest(`/trainers/${id}`);
  },

  // Admin Management
  createTrainer: async (trainerData) => {
    return apiRequest('/trainers', {
      method: 'POST',
      body: JSON.stringify(trainerData)
    });
  },
  updateTrainer: async (id, trainerData) => {
    return apiRequest(`/trainers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(trainerData)
    });
  },
  updateTrainerStatus: async (id, isActive) => {
    return apiRequest(`/trainers/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive })
    });
  },
  deleteTrainer: async (id) => {
    return apiRequest(`/trainers/${id}`, {
      method: 'DELETE'
    });
  }
};

export default trainerService;
