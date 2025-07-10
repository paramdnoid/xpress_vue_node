import axios from 'axios'
import { refreshAccessToken, getTokenRemainingSeconds } from '@/utils/auth'

const instance = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// 🔐 AccessToken vor jedem Request setzen
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 🔁 Bei 401 automatisch refreshen & retry
instance.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshed = await refreshAccessToken()
      
      if (refreshed) {
        const token = localStorage.getItem('accessToken')
        originalRequest.headers.Authorization = `Bearer ${token}`
        return instance(originalRequest)
      } else {
        window.location.href = '/login'
      }
    }

    return Promise.reject(err)
  }
)

export default instance