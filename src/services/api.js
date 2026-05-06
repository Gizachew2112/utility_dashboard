// src/services/api.js - API calls to backend

import axios from 'axios';

// TODO: Replace with your actual backend URL
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 401:
          // Unauthorized - token expired or invalid
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('user_role');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Forbidden: You do not have permission');
          break;
        case 404:
          console.error('API endpoint not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('API error:', error.response.data);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error: Unable to reach server');
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// ============ AUTHENTICATION APIs ============

export const login = (username, password) => {
  return api.post('/auth/login', { username, password });
};

export const logout = () => {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user_role');
};

export const getCurrentUser = () => {
  return api.get('/auth/me');
};

// ============ DASHBOARD APIs ============

export const getDashboardStats = () => {
  return api.get('/dashboard/stats');
};

export const getActiveAlerts = () => {
  return api.get('/alerts/active');
};

export const getAlertHistory = (params) => {
  return api.get('/alerts/history', { params });
};

// ============ METER APIs ============

export const getAllMeters = () => {
  return api.get('/meters');
};

export const getMeterDetails = (meterId) => {
  return api.get(`/meters/${meterId}`);
};

export const getMeterReadings = (meterId, range = 'day') => {
  return api.get(`/meters/${meterId}/readings`, { params: { range } });
};

export const getMeterConsumption = (meterId, period = 'month') => {
  return api.get(`/meters/${meterId}/consumption`, { params: { period } });
};

// ============ CONTROL APIs ============

export const disconnectMeter = (meterId, reason) => {
  return api.post(`/control/disconnect/${meterId}`, { reason });
};

export const reconnectMeter = (meterId) => {
  return api.post(`/control/reconnect/${meterId}`);
};

// ============ ANALYTICS APIs ============

export const getTheftAnalytics = (period = 'month') => {
  return api.get('/analytics/theft', { params: { period } });
};

export const getConsumptionAnalytics = (zone, period) => {
  return api.get('/analytics/consumption', { params: { zone, period } });
};

export const getRevenueReport = (startDate, endDate) => {
  return api.get('/analytics/revenue', { params: { startDate, endDate } });
};

// ============ NOTIFICATION APIs ============

export const getNotifications = () => {
  return api.get('/notifications');
};

export const markNotificationRead = (notificationId) => {
  return api.put(`/notifications/${notificationId}/read`);
};

export default api;