import axios from '@/axios';

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

export async function refreshAccessToken() {
  try {
    const res = await axios.post('/token/refresh', {});
    localStorage.setItem('accessToken', res.data.accessToken);
    return true;
  } catch (err) {
    console.error("Refresh failed", err);
    return false;
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