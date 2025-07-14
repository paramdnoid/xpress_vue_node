import axios from '@/axios';
import { useAuthStore } from '@/stores/auth'

// Verhindert mehrfache gleichzeitige Refresh-Requests
let refreshPromise = null;

export async function login(email, password) {
  const authStore = useAuthStore()
  try {
    const res = await axios.post('auth/login', { email, password });
    authStore.setAccessToken(res.data.accessToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`
    return true;
  } catch (err) {
    console.error('Login failed: Please check your email and password and try again.', err);
    return false;
  }
}

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // Füge 30 Sekunden Puffer hinzu, um Race Conditions zu vermeiden
    return Date.now() >= (payload.exp * 1000) - 30000
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

  // Wenn bereits ein Refresh läuft, warte auf das Ergebnis
  if (refreshPromise) {
    return await refreshPromise;
  }

  if (currentToken && !isTokenExpired(currentToken)) {
    return true // Token noch gültig
  }

  // Starte neuen Refresh
  refreshPromise = performTokenRefresh();
  
  try {
    const result = await refreshPromise;
    return result;
  } finally {
    // Reset nach Abschluss
    refreshPromise = null;
  }
}

async function performTokenRefresh() {
  const authStore = useAuthStore()
  
  try {
    const res = await axios.post('/token/refresh', {}, { 
      withCredentials: true,
      // Verwende keinen Authorization Header für Refresh
      headers: { 'Authorization': undefined }
    })

    const newToken = res.data?.accessToken
    if (newToken) {
      authStore.setAccessToken(newToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      
      // Lade User-Daten nach, falls nicht vorhanden
      if (!authStore.user) {
        try {
          const me = await axios.get('/auth/me');
          authStore.setUser(me.data);
        } catch (e) {
          console.warn('⚠️ Failed to load /auth/me:', e);
        }
      }
      
      console.log('🔄 Access token refreshed')
      return true
    } else {
      throw new Error('No token returned')
    }
  } catch (err) {
    console.warn('❌ Refresh failed, logging out...', err)
    await performLogout()
    return false
  }
}

async function performLogout() {
  const authStore = useAuthStore()
  
  try {
    await axios.post('/token/revoke', {}, { 
      withCredentials: true,
      headers: { 'Authorization': undefined }
    });
    console.log('🔒 Refresh token revoked');
  } catch (e) {
    console.warn("⚠️ Could not revoke token:", e?.response || e);
  }
  
  authStore.logout()
  delete axios.defaults.headers.common['Authorization']
  
  // Redirect nur wenn nicht bereits auf Login-Seite
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

export async function logout() {
  await performLogout();
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
  const authStore = useAuthStore()
  const token = authStore.accessToken
  if (!token) return 0
  const decoded = decodeJWT(token)
  if (!decoded || !decoded.exp) return 0
  return decoded.exp - Math.floor(Date.now() / 1000)
}

export function initAuthFromStorage() {
  const authStore = useAuthStore()
  const token = authStore.accessToken // Verwende Store statt localStorage
  if (token && !isTokenExpired(token)) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else if (token) {
    // Token abgelaufen, versuche Refresh
    refreshAccessToken()
  }
}

export function setupAxiosInterceptors() {
  // Request Interceptor
  axios.interceptors.request.use(
    async (config) => {
      const authStore = useAuthStore()
      
      // Skip für Auth-Endpoints
      if (config.url?.includes('/auth/') || config.url?.includes('/token/')) {
        return config
      }
      
      // Prüfe Token-Gültigkeit
      if (authStore.accessToken && isTokenExpired(authStore.accessToken)) {
        const refreshed = await refreshAccessToken()
        if (!refreshed) {
          return Promise.reject(new Error('Authentication failed'))
        }
      }
      
      if (authStore.accessToken) {
        config.headers['Authorization'] = `Bearer ${authStore.accessToken}`
      }
      
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response Interceptor
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
        
        // Versuche Token zu refreshen
        const refreshed = await refreshAccessToken()
        
        if (refreshed) {
          const authStore = useAuthStore()
          originalRequest.headers['Authorization'] = `Bearer ${authStore.accessToken}`
          return axios(originalRequest)
        } else {
          // Refresh fehlgeschlagen, logout bereits durchgeführt
          return Promise.reject(error)
        }
      }
      
      return Promise.reject(error)
    }
  )
}