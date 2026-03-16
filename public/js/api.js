/**
 * Base API utility wrapper for fetch requests
 */

const API_BASE_URL = window.location.origin;

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getUser() {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  setUser(user) {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  }

  logout() {
    this.setToken(null);
    this.setUser(null);
    window.location.href = '/login';
  }

  getHeaders(isMultipart = false) {
    const headers = {};
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const isMultipart = options.body instanceof FormData;
    const headers = { ...this.getHeaders(isMultipart), ...options.headers };

    const config = {
      ...options,
      headers
    };

    if (config.body && !isMultipart && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Handle unauthorized explicitly
      if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/library/verify') {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error((data && data.message) ? data.message : `HTTP Error ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Request Failed [${options.method || 'GET'} ${endpoint}]:`, error);
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, { method: 'POST', body: data, ...options });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, { method: 'PUT', body: data, ...options });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }
}

// Global instance
const api = new ApiClient();

// UI Utility functions
function showToast(message, type = 'info') {
  const existing = document.getElementById('global-toast');
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'global-toast';
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
