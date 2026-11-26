/**
 * Centralized API Client Configuration
 * Enforces session cookie inclusion (credentials: 'include') and standardized JSON parsing.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/fitsphere/api';

/**
 * Custom API Error class preserving backend error code and HTTP status.
 */
export class ApiError extends Error {
  /**
   * @param {string} message - Human-readable explanation of why the request failed
   * @param {string|null} [code=null] - Backend machine-readable error code (e.g. 'CLASS_FULL', 'INVALID_CREDENTIALS')
   * @param {number|null} [status=null] - HTTP status code (e.g. 400, 401, 403, 404, 409, 500)
   */
  constructor(message, code = null, status = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Base fetch wrapper for all FitSphere API requests.
 * @param {string} endpoint - API route (e.g. '/trainers')
 * @param {RequestInit} [options={}] - Fetch configuration options
 * @returns {Promise<any>} Parsed JSON response
 * @throws {ApiError} Structured API error on failure
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const config = {
    ...options,
    credentials: 'include', // Essential for Java Servlet HttpSession cookies
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = (data && data.message) || response.statusText || 'API Request Failed';
    const errorCode = (data && data.error) || null;
    throw new ApiError(errorMessage, errorCode, response.status);
  }

  return data;
}

export default {
  apiRequest,
  ApiError,
  API_BASE_URL
};
