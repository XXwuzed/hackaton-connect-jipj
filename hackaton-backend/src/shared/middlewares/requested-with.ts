import type { RequestHandler } from 'express';
import { ForbiddenError } from '../errors';

/** Exige una cabecera no enviable por formularios simples en mutaciones. */
export const requireRequestedWith: RequestHandler = (
  request,
  _response,
  next,
) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next();
  if (request.get('X-Requested-With') !== 'club') {
    return next(
      new ForbiddenError(
        'Falta X-Requested-With: club',
        'CSRF_HEADER_REQUIRED',
      ),
    );
  }
  next();
};
