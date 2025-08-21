import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Get the base URL for API calls
const getBaseURL = () => {
  // In development, use the proxy
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // In production, use the Render backend URL
  return 'https://university-recruitment-backend.onrender.com/api';
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, logout user
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 