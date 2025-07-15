let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}
import axios from 'axios'
import { refreshAccessToken } from '@/utils/auth'


const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';
const instance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
})


// 🔁 Bei 401 automatisch refreshen & retry (mit Queue für parallele Requests)
instance.interceptors.response.use(
  response => response,
  err => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      // Prevent infinite loop if refresh endpoint fails
      if (originalRequest.url.includes('/auth/refresh')) {
        window.location.href = '/login';
        return Promise.reject(err);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => instance(originalRequest))
          .catch(error => Promise.reject(error));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        refreshAccessToken()
          .then(refreshed => {
            isRefreshing = false;
            if (refreshed) {
              processQueue(null);
              resolve(instance(originalRequest));
            } else {
              processQueue(err);
              window.location.href = '/login';
              reject(err);
            }
          })
          .catch(error => {
            isRefreshing = false;
            processQueue(error);
            window.location.href = '/login';
            reject(error);
          });
      });
    }

    return Promise.reject(err);
  }
);

export default instance