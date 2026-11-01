import api from './api';

const clean = (params) => Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== '' && v != null));
const get = (url, params) => api.get(url, { params: clean(params) }).then((r) => r.data);

export const adminService = {
  dashboard: () => get('/admin/dashboard'),
  reports: (from, to) => get('/admin/reports', { from, to }),

  products: (params) => get('/admin/products', params),
  product: (id) => get(`/admin/products/${id}`),
  createProduct: (p) => api.post('/admin/products', p).then((r) => r.data),
  updateProduct: (id, p) => api.put(`/admin/products/${id}`, p).then((r) => r.data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`).then((r) => r.data),

  createCategory: (c) => api.post('/admin/categories', c).then((r) => r.data),
  updateCategory: (id, c) => api.put(`/admin/categories/${id}`, c).then((r) => r.data),
  deleteCategory: (id, reassignTo) => api.delete(`/admin/categories/${id}`, { params: clean({ reassignTo }) }).then((r) => r.data),

  inventory: (params) => get('/admin/inventory', params),
  adjustStock: (productId, payload) => api.post(`/admin/inventory/${productId}/adjust`, payload).then((r) => r.data),
  stockHistory: (productId, page = 0) => get(`/admin/inventory/${productId}/history`, { page, size: 8 }),

  orders: (params) => get('/admin/orders', params),
  order: (id) => get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status, note) => api.put(`/admin/orders/${id}/status`, { status, note }).then((r) => r.data),

  customers: (params) => get('/admin/customers', params),
  customer: (id) => get(`/admin/customers/${id}`),
  setCustomerStatus: (id, enabled) => api.patch(`/admin/customers/${id}/status`, { enabled }).then((r) => r.data),

  reviews: (params) => get('/admin/reviews', params),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`).then((r) => r.data),
  dismissReport: (id) => api.patch(`/admin/reviews/${id}/dismiss-report`).then((r) => r.data),

  upload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/admin/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
};
