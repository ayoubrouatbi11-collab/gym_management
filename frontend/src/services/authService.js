import { apiRequest } from './api';

/**
 * Authentication Service (Shared across roles)
 * - Login: POST /auth/login
 * - Get Current Session: GET /auth/me
 * - Logout: POST /auth/logout
 * Reference: docs/API_CONTRACT.md Section 3
 */
export const authService = {
  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },
  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },
  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST'
    });
  }
};

export default authService;
