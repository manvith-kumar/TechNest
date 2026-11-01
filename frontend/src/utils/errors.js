/** Turns any Axios error into a sentence the user can act on. */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  if (err.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (!err.response) return 'Cannot reach the server. Check your connection and that the backend is running.';
  const data = err.response.data;
  if (data && typeof data.message === 'string' && data.message) return data.message;
  if (err.response.status >= 500) return 'The server ran into a problem. Please try again shortly.';
  return fallback;
}
export const getFieldErrors = (err) => err?.response?.data?.fieldErrors || {};
