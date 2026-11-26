import { apiRequest } from './api';

/**
 * Class Booking Service
 * - Member class booking and personal booking history (/bookings/my)
 * - Booking cancellation (/bookings/:id/cancel)
 * - Administrative booking oversight (/bookings)
 * Reference: docs/API_CONTRACT.md Section 11
 */
export const bookingService = {
  // Member Bookings
  bookClass: async (classId) => {
    return apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify({ classId })
    });
  },
  getMyBookings: async () => {
    return apiRequest('/bookings/my');
  },
  cancelBooking: async (id) => {
    return apiRequest(`/bookings/${id}/cancel`, {
      method: 'PUT'
    });
  },

  // Admin Oversight
  getAllBookings: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/bookings?${query}` : '/bookings';
    return apiRequest(endpoint);
  }
};

export default bookingService;
