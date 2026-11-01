export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PASSWORD_HINT = 'At least 8 characters with an upper-case letter, a lower-case letter and a number.';

/** Mirrors the server-side @StrongPassword rule; the server remains the authority. */
export const isStrongPassword = (p) => typeof p === 'string' && p.length >= 8 && p.length <= 72 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p);
