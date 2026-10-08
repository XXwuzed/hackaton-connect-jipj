import argon2 from 'argon2';
import type { PrismaClient } from '@prisma/client';
import { log } from '../../audit';
import { UnauthorizedError } from '../../../shared/errors';
import type { ChangePasswordInput } from '../auth.dto';
import {
  safeUserSelect,
  type AuthUser,
  type RequestContext,
} from '../auth.types';

/** Cambia el hash y audita solo el cambio de estado, no la contraseña. */
export async function changePassword(
  prisma: PrismaClient,
  actor: AuthUser,
  input: ChangePasswordInput,
  context: RequestContext,
): Promise<AuthUser> {
  const current = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { passwordHash: true, active: true, mustChangePassword: true },
  });
  if (
    !current?.active ||
    !(await argon2.verify(current.passwordHash, input.currentPassword))
  ) {
    throw new UnauthorizedError('Contraseña actual incorrecta');
  }
  const passwordHash = await argon2.hash(input.newPassword, {
    type: argon2.argon2id,
  });
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: actor.id },
      data: { passwordHash, mustChangePassword: false },
      select: safeUserSelect,
    });
    await log(tx, {
      actorId: actor.id,
      actorRole: actor.role,
      action: 'auth.change_password',
      entityType: 'User',
      entityId: actor.id,
      before: { mustChangePassword: current.mustChangePassword },
      after: { mustChangePassword: false },
      ...context,
    });
    return user;
  });
}
