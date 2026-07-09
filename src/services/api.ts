import axios from 'axios';
import { REST_API_BASE_URL } from '@/app/config/api';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: REST_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 10000, // 10 seconds
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response Interceptor - Global Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message 
      || error.response?.data?.title 
      || error.message 
      || 'An unexpected error occurred';

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;