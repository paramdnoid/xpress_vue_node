import axios from 'axios';
import { refreshAccessToken } from './utils/auth';

const instance = axios.create({
  baseURL: '/api',
  withCredentials: true
});

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

instance.interceptors.response.use(null, async error => {
  const originalRequest = error.config;
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    const success = await refreshAccessToken();
    if (success) {
      originalRequest.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
      return instance(originalRequest);
    }
  }
  return Promise.reject(error);
});

export default instance;