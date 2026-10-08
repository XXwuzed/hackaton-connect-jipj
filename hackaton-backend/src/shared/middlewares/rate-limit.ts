import { rateLimit } from 'express-rate-limit';

const response = {
  error: { code: 'RATE_LIMITED', message: 'Demasiadas solicitudes' },
};

export const httpRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: response,
});

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: response,
  keyGenerator: (request) => {
    const email =
      typeof request.body?.email === 'string'
        ? request.body.email.trim().toLowerCase()
        : '';
    return `${request.ip ?? 'unknown'}:${email}`;
  },
});

export const registrationRateLimit = rateLimit({
  windowMs: 60 * 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: response,
});
