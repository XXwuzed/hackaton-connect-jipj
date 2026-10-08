import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationError } from '../errors';

/** Valida el cuerpo antes de entregarlo al controller. */
export function validateBody(schema: ZodTypeAny): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      // Devuelve el primer problema para que la UI muestre qué corregir.
      const issue = result.error.issues[0];
      next(
        new ValidationError(
          issue
            ? `${issue.path.join('.') || 'dato'}: ${issue.message}`
            : undefined,
        ),
      );
      return;
    }
    request.body = result.data;
    next();
  };
}
