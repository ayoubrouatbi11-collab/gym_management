import { apiRequest } from './api';

/**
 * User & Profile Service
 * - Member self-service profile and password changes (/users/me, /users/me/password)
 * - Administrative member management CRUD (/users/*)
 * Reference: docs/API_CONTRACT.md Section 4 & Section 5
 */
export const userService = {
  // Member Self-Service
  getProfile: async () => {
    return apiRequest('/users/me');
  },
  updateProfile: async (profileData) => {
    return apiRequest('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },
  changePassword: async (passwordData) => {
    return apiRequest('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData)
    });
  },

  // Admin Management
  getAllUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/users?${query}` : '/users';
    return apiRequest(endpoint);
  },
  getUserById: async (id) => {
    return apiRequest(`/users/${id}`);
  },
  createUser: async (userData) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  updateUser: async (id, userData) => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },
  updateUserStatus: async (id, status) => {
    return apiRequest(`/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ accountStatus: status })
    });
  },
  deleteUser: async (id) => {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE'
    });
  }
};

export default userService;
