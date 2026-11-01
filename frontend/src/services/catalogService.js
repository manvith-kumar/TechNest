import api from './api';

const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null && !(Array.isArray(v) && v.length === 0)));
// Repeat array params (brand=a&brand=b) instead of brand[]=a
const paramsSerializer = { indexes: null };

export const productService = {
  list: (params) => api.get('/products', { params: clean(params), paramsSerializer }).then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
  collection: (type, limit = 8) => api.get(`/products/collections/${type}`, { params: { limit } }).then((r) => r.data),
  related: (id, limit = 4) => api.get(`/products/${id}/related`, { params: { limit } }).then((r) => r.data),
  brands: () => api.get('/products/brands').then((r) => r.data),
  compare: (ids) => api.get('/products/compare', { params: { ids: ids.join(',') } }).then((r) => r.data),
};

export const categoryService = {
  list: () => api.get('/categories').then((r) => r.data),
};

export const reviewService = {
  list: (productId, page = 0, size = 5) => api.get(`/products/${productId}/reviews`, { params: { page, size } }).then((r) => r.data),
  summary: (productId) => api.get(`/products/${productId}/reviews/summary`).then((r) => r.data),
  eligibility: (productId) => api.get(`/products/${productId}/reviews/eligibility`).then((r) => r.data),
  create: (productId, payload) => api.post(`/products/${productId}/reviews`, payload).then((r) => r.data),
  update: (id, payload) => api.put(`/reviews/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/reviews/${id}`).then((r) => r.data),
  report: (id) => api.post(`/reviews/${id}/report`).then((r) => r.data),
};

export const newsletterService = {
  subscribe: (email) => api.post('/newsletter', { email }).then((r) => r.data),
};
