import axios from 'axios';

// Access token lives in memory + localStorage; the refresh token is an
// httpOnly cookie the browser sends automatically to /api/auth/refresh.
const TOKEN_KEY = 'smartcare_access_token';

let accessToken = localStorage.getItem(TOKEN_KEY) || null;

export function setAccessToken(token) {
  accessToken = token || null;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAccessToken() {
  return accessToken;
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send the refresh cookie
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ── Silent refresh on 401 ────────────────────────────────
// A single in-flight refresh is shared by all queued requests so a burst of
// 401s triggers exactly one /auth/refresh call.
let refreshing = null;

function doRefresh() {
  if (!refreshing) {
    refreshing = axios
      .post('/api/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        setAccessToken(res.data.accessToken);
        return res.data.accessToken;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Never try to refresh the refresh/login calls themselves.
    const isAuthRoute =
      original?.url?.includes('/auth/refresh') ||
      original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/register');

    if (status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        const token = await doRefresh();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (e) {
        setAccessToken(null);
        // Let the caller / AuthContext react to a hard logout.
        window.dispatchEvent(new CustomEvent('smartcare:logout'));
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

// Normalises the various error shapes the API can return into a plain string.
export function errMsg(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === 'string') return data;
  const err = data.error || data;
  if (err.message) return err.message;
  if (Array.isArray(err.errors) && err.errors.length) {
    return err.errors.map((e) => e.msg || e.message).filter(Boolean).join(' ');
  }
  if (Array.isArray(data.errors) && data.errors.length) {
    return data.errors.map((e) => e.msg || e.message).filter(Boolean).join(' ');
  }
  return fallback;
}

// Extracts structured details from an API error response (e.g. OUTSIDE_PERIMETER).
export function errDetails(error) {
  const data = error?.response?.data;
  const err = data?.error || data;
  return err?.details || null;
}

export default api;
