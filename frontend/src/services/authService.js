import api, { tokenStore, refreshSession } from './api';

const adopt = (data) => { tokenStore.set(data.accessToken); return data.user; };

export const authService = {
  register: (payload) => api.post('/auth/register', payload).then((r) => adopt(r.data)),
  login: (payload) => api.post('/auth/login', payload).then((r) => adopt(r.data)),
  restore: () => refreshSession().then((data) => data.user),
  logout: () => api.post('/auth/logout').finally(() => tokenStore.set(null)),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }).then((r) => r.data),
  me: () => api.get('/users/me').then((r) => r.data),
  updateProfile: (payload) => api.put('/users/me', payload).then((r) => r.data),
  changePassword: (payload) => api.put('/users/me/password', payload).then((r) => adopt(r.data)),
};
