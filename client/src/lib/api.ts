import axios, { AxiosError } from 'axios';
import type { DetailedError } from '../components/ErrorDisplay';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Show detailed errors if the server sends them (regardless of client build mode)
// The server decides whether to send detailed errors based on its NODE_ENV

// Global error handler callback
let errorDisplayCallback: ((error: DetailedError) => void) | null = null;

export function setErrorDisplayCallback(callback: (error: DetailedError) => void) {
  errorDisplayCallback = callback;
}

export function clearErrorDisplayCallback() {
  errorDisplayCallback = null;
}

// Check if an error response contains detailed error info
function isDetailedError(data: unknown): data is DetailedError {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    'timestamp' in data &&
    'environment' in data
  );
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors and detailed dev errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle detailed errors - show if server sends them (server controls when to send)
    if (error.response?.data && isDetailedError(error.response.data)) {
      const detailedError = error.response.data;
      console.error('Detailed API Error:', detailedError);
      
      // Show error display if callback is registered
      if (errorDisplayCallback) {
        errorDisplayCallback(detailedError);
      }
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Don't redirect on public routes
      if (!window.location.pathname.startsWith('/b/')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
