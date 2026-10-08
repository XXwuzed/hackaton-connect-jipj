import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationError } from '../errors';

/** Valida el cuerpo antes de entregarlo al controller. */
export function validateBody(schema: ZodTypeAny): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      next(new ValidationError());
      return;
    }
    request.body = result.data;
    next();
  };
}
