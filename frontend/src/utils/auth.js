import axios from '@/axios';

export async function login(email, password) {
  try {
    const res = await axios.post('auth/login', { email, password }, { withCredentials: true });
    localStorage.setItem('accessToken', res.data.accessToken);
    return true;
  } catch (err) {
    console.error('Login failed: Please check your email and password and try again.', err);
    return false;
  }
}

export async function refreshAccessToken() {
  try {
    const res = await axios.post('/api/token/refresh', {}, { withCredentials: true });
    localStorage.setItem('accessToken', res.data.accessToken);
    return true;
  } catch (err) {
    console.error("Refresh failed", err);
    return false;
  }
}

export async function logout() {
  const refreshToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('refresh_token='));

  if (refreshToken) {
    try {
      await axios.post('/token/revoke', {}, { withCredentials: true });
    } catch (e) {
      console.warn("Could not revoke token");
    }
  }

  localStorage.removeItem('token');
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