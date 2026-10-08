import type { PrismaClient } from '@prisma/client';
import type { Config } from '../../../shared/config';
import { ForbiddenError, UnauthorizedError } from '../../../shared/errors';
import { safeUserSelect } from '../auth.types';
import { signToken, verifyToken } from '../auth.tokens';

/** Rota cookies y vuelve a consultar el estado activo del usuario. */
export async function refresh(
  prisma: PrismaClient,
  token: string | undefined,
  config: Config,
) {
  const userId = await verifyToken(token, 'refresh', config);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  });
  if (!user?.active) throw new UnauthorizedError();
  if (user.mustChangePassword) {
    throw new ForbiddenError(
      'Debes cambiar tu contraseña',
      'PASSWORD_CHANGE_REQUIRED',
    );
  }
  const [accessToken, refreshToken] = await Promise.all([
    signToken(user.id, 'access', config),
    signToken(user.id, 'refresh', config),
  ]);
  return { user, accessToken, refreshToken };
}
