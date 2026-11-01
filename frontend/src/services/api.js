import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';
const AJAX = { 'X-Requested-With': 'XMLHttpRequest' };

// The short-lived access token lives only in memory. The refresh token is an HttpOnly cookie the browser manages.
let accessToken = null;
let onAuthLost = null;

export const tokenStore = { get: () => accessToken, set: (t) => { accessToken = t; } };
export const setAuthLostHandler = (fn) => { onAuthLost = fn; };

const api = axios.create({ baseURL, withCredentials: true, headers: AJAX, timeout: 20000 });

api.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});

let refreshing = null;
/** Single-flight: parallel 401s share one refresh call (the server rotates refresh tokens). */
export function refreshSession() {
  if (!refreshing) {
    refreshing = axios
      .post(`${baseURL}/auth/refresh`, null, { withCredentials: true, headers: AJAX, timeout: 20000 })
      .then((r) => { accessToken = r.data.accessToken; return r.data; })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const isAuthCall = config?.url?.startsWith('/auth/');
    if (response?.status === 401 && config && !config._retried && !isAuthCall && accessToken) {
      config._retried = true;
      try {
        await refreshSession();
        config.headers.Authorization = `Bearer ${accessToken}`;
        return api(config);
      } catch {
        accessToken = null;
        if (onAuthLost) onAuthLost();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
