import axios from '@/axios';
import { useAuthStore } from '@/stores/auth'

export async function login(email, password) {
  const authStore = useAuthStore()
  try {
    const res = await axios.post('auth/login', { email, password });
    authStore.setAccessToken(res.data.accessToken)
    localStorage.setItem('accessToken', res.data.accessToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`
    return true;
  } catch (err) {
    console.error('Login failed: Please check your email and password and try again.', err);
    return false;
  }
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return Date.now() >= payload.exp * 1000
  } catch (e) {
    console.warn('⚠️ Invalid token format')
    return true
  }
}

/**
 * Refreshes access token if expired. Logs out via Pinia if failed.
 * @returns {Promise<boolean>} true if refreshed, false if failed and logged out
 */
export async function refreshAccessToken() {
  const authStore = useAuthStore()
  const currentToken = authStore.accessToken

  if (currentToken && !isTokenExpired(currentToken)) {
    return true // Token noch gültig
  }

  try {
    const res = await axios.post('/token/refresh', {}, { withCredentials: true })

    const newToken = res.data?.accessToken
    if (newToken) {
      authStore.setAccessToken(newToken)
      localStorage.setItem('accessToken', newToken)
      const decoded = decodeJWT(newToken);
      if (decoded && !authStore.user) {
        if (decoded.email && decoded.role) {
          authStore.setUser(decoded);
        } else {
          try {
            const me = await axios.get('/auth/me');
            authStore.setUser(me.data);
          } catch (e) {
            console.warn('⚠️ Failed to load /auth/me:', e);
          }
        }
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      console.log('🔄 Access token refreshed')
      return true
    } else {
      throw new Error('No token returned')
    }
  } catch (err) {
    console.warn('❌ Refresh failed, logging out...')
    authStore.logout()
    window.location.href = '/login'
    return false
  }
}

export async function logout() {
  const authStore = useAuthStore()
  try {
    await axios.post('/token/revoke', {}, { withCredentials: true });
    console.log('🔒 Refresh token revoked');
  } catch (e) {
    console.warn("⚠️ Could not revoke token:", e?.response || e);
  }
  authStore.logout()
  window.location.href = '/login';
}

export function decodeJWT(token) {
  try {
    if (!token) return null;
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch (e) {
    console.error('Invalid JWT', e);
    return null;
  }
}

export function getTokenRemainingSeconds() {
  const token = localStorage.getItem('accessToken')
  if (!token) return 0
  const decoded = decodeJWT(token)
  if (!decoded || !decoded.exp) return 0
  return decoded.exp - Math.floor(Date.now() / 1000)
}

export function initAuthFromStorage() {
  const token = localStorage.getItem('accessToken')
  if (token) {
    const authStore = useAuthStore()
    authStore.setAccessToken(token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }
}

export function setupAxiosInterceptors() {
  axios.interceptors.request.use(async (config) => {
    const authStore = useAuthStore()
    if (authStore.accessToken && isTokenExpired(authStore.accessToken)) {
      await refreshAccessToken()
    }
    config.headers['Authorization'] = `Bearer ${authStore.accessToken}`
    return config
  })

  axios.interceptors.response.use(
    res => res,
    err => {
      if (err.response?.status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
      }
      return Promise.reject(err)
    }
  )
}