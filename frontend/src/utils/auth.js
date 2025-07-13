import axios from '@/axios';
import { useAuthStore } from '@/stores/auth'
import debug from 'debug';
const log = debug('auth');

/**
 * Attempts to authenticate the user with the supplied credentials.
 * On success the access token is saved to the Pinia auth store and
 * axios' default Authorization header is updated.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<boolean>} true on success, false otherwise
 */
export async function login(email, password) {
  const authStore = useAuthStore()
  try {
    const res = await axios.post('auth/login', { email, password });
    authStore.setAccessToken(res.data.accessToken)
    return true;
  } catch (err) {
    log('Login failed: Please check your email and password and try again.', err);
    return false;
  }
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    return Date.now() >= payload.exp * 1000
  } catch (e) {
    log('⚠️ Invalid token format')
    return true
  }
}

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

/**
 * Refreshes the access token using the stored refresh cookie
 * and updates both the Pinia store and axios defaults.
 *
 * When the refresh fails (e.g. 401 or network error) the user
 * is logged out and redirected to /login.
 *
 * @returns {Promise<boolean>} true when the token could be refreshed, false otherwise
 */
export async function refreshAccessToken() {
  const authStore = useAuthStore();
  const currentToken = authStore.accessToken;

  // Token noch gültig? → nichts tun
  if (currentToken && !isTokenExpired(currentToken)) {
    return true;
  }

  // Läuft bereits ein Refresh? → an die Queue hängen
  if (isRefreshing) {
    return new Promise(resolve => subscribeTokenRefresh(resolve));
  }

  // Jetzt selbst refreshen
  isRefreshing = true;
  try {
    const res = await axios.post('/token/refresh', {}, { withCredentials: true });
    const newToken = res.data?.accessToken;
    if (!newToken) throw new Error('No token returned');

    authStore.setAccessToken(newToken);
    onRefreshed(true);
    log('🔄 Access token refreshed');
    return true;
  } catch (err) {
    onRefreshed(false);
    log('❌ Refresh failed, logging out...', err);
    authStore.logout();
    window.location.href = '/login';
    return false;
  } finally {
    isRefreshing = false;
  }
}

export async function logout() {
  const authStore = useAuthStore()
  try {
    await axios.post('/token/revoke', {}, { withCredentials: true });
    log('🔒 Refresh token revoked');
  } catch (e) {
    log("⚠️ Could not revoke token:", e?.response || e);
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
    log('Invalid JWT', e);
    return null;
  }
}

export function getTokenRemainingSeconds(token = null) {
  const authStore = useAuthStore();
  const jwt = token || authStore.accessToken;
  if (!jwt) return 0;
  const decoded = decodeJWT(jwt);
  if (!decoded || !decoded.exp) return 0;
  return decoded.exp - Math.floor(Date.now() / 1000);
}

export function setupAxiosInterceptors() {
  axios.interceptors.request.use(async (config) => {
    const authStore = useAuthStore();
    // proaktiver Refresh 30 s vor Ablauf
    if (authStore.accessToken && getTokenRemainingSeconds() < 30) {
      await refreshAccessToken();
    }
    if (authStore.accessToken) {
      config.headers['Authorization'] = `Bearer ${authStore.accessToken}`;
    }
    return config;
  });

  axios.interceptors.response.use(
    res => res,
    err => {
      if (err.response?.status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        log('Unauthorized access, logging out');
        window.location.href = '/login'
      }
      return Promise.reject(err)
    }
  )
}