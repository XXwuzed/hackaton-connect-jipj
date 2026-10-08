import argon2 from 'argon2';
import type { PrismaClient } from '@prisma/client';
import { log } from '../../audit';
import { UnauthorizedError } from '../../../shared/errors';
import type { Config } from '../../../shared/config';
import type { LoginInput } from '../auth.dto';
import { safeUserSelect, type RequestContext } from '../auth.types';
import { signToken } from '../auth.tokens';

/** Autentica y audita el resultado sin exponer credenciales. */
export async function login(
  prisma: PrismaClient,
  input: LoginInput,
  context: RequestContext,
  config: Config,
) {
  const found = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...safeUserSelect, passwordHash: true },
  });
  let valid = false;
  if (found?.active) {
    try {
      valid = await argon2.verify(found.passwordHash, input.password);
    } catch {
      valid = false;
    }
  }
  if (!found || !valid) {
    await prisma.$transaction((tx) =>
      log(tx, {
        actorId: found?.id ?? null,
        actorRole: found?.role ?? null,
        action: 'auth.login_failed',
        entityType: 'User',
        entityId: found?.id ?? null,
        after: { reason: 'invalid_credentials' },
        ...context,
      }),
    );
    throw new UnauthorizedError('Credenciales inválidas');
  }

  const [accessToken, refreshToken] = await Promise.all([
    signToken(found.id, 'access', config),
    signToken(found.id, 'refresh', config),
  ]);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: found.id },
      data: { lastLoginAt: new Date() },
    });
    await log(tx, {
      actorId: found.id,
      actorRole: found.role,
      action: 'auth.login',
      entityType: 'User',
      entityId: found.id,
      ...context,
    });
  });
  const { passwordHash: _passwordHash, ...user } = found;
  void _passwordHash;
  return { user, accessToken, refreshToken };
}
