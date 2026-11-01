import api from './api';

export const cartService = {
  get: () => api.get('/cart').then((r) => r.data),
  add: (productId, quantity = 1) => api.post('/cart/items', { productId, quantity }).then((r) => r.data),
  update: (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity }).then((r) => r.data),
  remove: (itemId) => api.delete(`/cart/items/${itemId}`).then((r) => r.data),
  clear: () => api.delete('/cart').then((r) => r.data),
};

export const wishlistService = {
  list: () => api.get('/wishlist').then((r) => r.data),
  add: (productId) => api.post(`/wishlist/${productId}`).then((r) => r.data),
  remove: (productId) => api.delete(`/wishlist/${productId}`).then((r) => r.data),
};

export const addressService = {
  list: () => api.get('/addresses').then((r) => r.data),
  create: (payload) => api.post('/addresses', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/addresses/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/addresses/${id}`).then((r) => r.data),
};

export const orderService = {
  place: (payload) => api.post('/orders', payload).then((r) => r.data),
  mine: (page = 0, size = 10) => api.get('/orders/my-orders', { params: { page, size } }).then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  cancel: (id) => api.post(`/orders/${id}/cancel`).then((r) => r.data),
};
