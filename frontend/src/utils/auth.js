import axios from '@/axios';
import { useAuthStore } from '@/stores/auth'

export async function login(email, password) {
  try {
    const res = await axios.post('auth/login', { email, password });
    localStorage.setItem('accessToken', res.data.accessToken);
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
  const currentToken = localStorage.getItem('accessToken')

  if (currentToken && !isTokenExpired(currentToken)) {
    return true // Token noch gültig
  }

  try {
    const res = await axios.post('/token/refresh', {}, { withCredentials: true })

    const newToken = res.data?.accessToken
    if (newToken) {
      localStorage.setItem('accessToken', newToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      console.log('🔄 Access token refreshed')
      return true
    } else {
      throw new Error('No token returned')
    }
  } catch (err) {
    console.warn('❌ Refresh failed, logging out...')
    authStore.clearUser()
    localStorage.removeItem('accessToken')
    window.location.href = '/login'
    return false
  }
}

export async function logout() {
  try {
    await axios.post('/token/revoke', {}, { withCredentials: true });
    console.log('🔒 Refresh token revoked');
  } catch (e) {
    console.warn("⚠️ Could not revoke token:", e?.response || e);
  }

  localStorage.removeItem('accessToken');
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