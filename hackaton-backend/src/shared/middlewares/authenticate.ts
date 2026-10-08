import type { PrismaClient } from '@prisma/client';
import type { RequestHandler } from 'express';
import { safeUserSelect } from '../../modules/auth/auth.types';
import { verifyToken } from '../../modules/auth/auth.tokens';
import type { Config } from '../config';
import { ForbiddenError, UnauthorizedError } from '../errors';

/** Verifica cookie, firma, estado activo y cambio obligatorio. */
export function authenticate(
  prisma: PrismaClient,
  config: Config,
  allowPasswordChangeOnly = false,
): RequestHandler {
  return async (request, _response, next) => {
    try {
      const userId = await verifyToken(
        request.cookies?.club_access,
        'access',
        config,
      );
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: safeUserSelect,
      });
      if (!user?.active) throw new UnauthorizedError();
      if (user.mustChangePassword && !allowPasswordChangeOnly) {
        throw new ForbiddenError(
          'Debes cambiar tu contraseña',
          'PASSWORD_CHANGE_REQUIRED',
        );
      }
      request.authUser = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}
