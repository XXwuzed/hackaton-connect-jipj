import type { Permission } from '@club/contracts';
import type { RequestHandler } from 'express';
import { hasPermission } from '../authz/permissions';
import { ForbiddenError, UnauthorizedError } from '../errors';

/** Aplica RBAC en el servidor, independientemente del menú. */
export function authorize(permission: Permission): RequestHandler {
  return (request, _response, next) => {
    if (!request.authUser) return next(new UnauthorizedError());
    if (!hasPermission(request.authUser.role, permission)) {
      return next(new ForbiddenError());
    }
    next();
  };
}
