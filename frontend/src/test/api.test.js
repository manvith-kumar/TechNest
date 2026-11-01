import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api, { setAuthLostHandler, tokenStore } from '../services/api';

const ok = (config, data = {}) => ({ data, status: 200, statusText: 'OK', headers: {}, config });
const unauthorized = (config) => Promise.reject({ config, response: { status: 401, data: { message: 'expired' } } });

describe('api client', () => {
  beforeEach(() => { tokenStore.set('old-token'); });
  afterEach(() => { vi.restoreAllMocks(); setAuthLostHandler(null); tokenStore.set(null); });

  it('sends the in-memory bearer token and the ajax header', async () => {
    let seen;
    api.defaults.adapter = async (config) => { seen = config.headers; return ok(config); };
    await api.get('/cart');
    expect(seen.Authorization).toBe('Bearer old-token');
    expect(seen['X-Requested-With']).toBe('XMLHttpRequest');
  });

  it('refreshes once on 401 and replays the request with the new token', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'new-token' } });
    const calls = [];
    api.defaults.adapter = async (config) => {
      calls.push(config.headers.Authorization);
      return calls.length === 1 ? unauthorized(config) : ok(config, { fine: true });
    };
    const res = await api.get('/orders/my-orders');
    expect(res.data).toEqual({ fine: true });
    expect(calls).toEqual(['Bearer old-token', 'Bearer new-token']);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('shares one refresh between parallel 401s', async () => {
    const post = vi.spyOn(axios, 'post').mockImplementation(() => new Promise((r) => setTimeout(() => r({ data: { accessToken: 'n2' } }), 20)));
    const seen = {};
    api.defaults.adapter = async (config) => {
      const key = config.url;
      seen[key] = (seen[key] || 0) + 1;
      return seen[key] === 1 ? unauthorized(config) : ok(config);
    };
    await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')]);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('signs the user out when refresh fails', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue({ response: { status: 401 } });
    const lost = vi.fn();
    setAuthLostHandler(lost);
    api.defaults.adapter = async (config) => unauthorized(config);
    await expect(api.get('/cart')).rejects.toBeTruthy();
    expect(lost).toHaveBeenCalled();
    expect(tokenStore.get()).toBeNull();
  });

  it('does not try to refresh failed login attempts', async () => {
    const post = vi.spyOn(axios, 'post');
    api.defaults.adapter = async (config) => unauthorized(config);
    await expect(api.post('/auth/login', {})).rejects.toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });
});
