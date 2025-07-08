import axios from 'axios';
import { refreshAccessToken } from '@/utils/auth';

const instance = axios.create({
  baseURL: '/api',
  withCredentials: true
});

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else console.warn('⚠️ No token found in localStorage');
  return config;
});

instance.interceptors.response.use(null, async error => {
  console.error('❌ Axios error object:', error);

  const originalRequest = error.config;
  console.log('🔁 _retry flag on originalRequest:', originalRequest._retry);

  if (error.response?.status === 401 && !originalRequest._retry) {
    console.log('🔁 Detected 401 and _retry is not set – trying refreshAccessToken');
    originalRequest._retry = true;

    try {
      const success = await refreshAccessToken();
      if (success) {
        console.log('✅ Token refresh succeeded');
        originalRequest.headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`;
        return instance(originalRequest);
      } else {
        console.warn('❌ Refresh token failed – redirecting');
        window.location.href = '/login';
      }
    } catch (e) {
      console.error('⚠️ refreshAccessToken() failed with error:', e);
    }
  }

  return Promise.reject(error);
});

export default instance;