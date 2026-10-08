import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { Prisma, type PrismaClient, type Role } from '@prisma/client';
import type { AuthUser, RequestContext } from '../auth/auth.types';
import { safeUserSelect } from '../auth/auth.types';
import { log } from '../audit';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../shared/errors';
import { pageMeta } from '../../shared/page';
import type {
  CreateUserInput,
  UpdateUserInput,
  ProfileInput,
} from './users.dto';

async function validateScope(
  tx: Prisma.TransactionClient,
  data: {
    role: Role;
    companyId: string | null;
    zoneId: string | null;
    storeId: string | null;
  },
) {
  if (data.role === 'ADMIN') {
    if (data.companyId || data.zoneId || data.storeId)
      throw new ValidationError('ADMIN no puede tener empresa, zona ni tienda');
    return;
  }
  if (!data.companyId || !data.zoneId || !data.storeId)
    throw new ValidationError('ASESOR requiere empresa, zona y tienda');
  const [company, zone, store] = await Promise.all([
    tx.company.findUnique({ where: { id: data.companyId } }),
    tx.zone.findUnique({ where: { id: data.zoneId } }),
    tx.store.findUnique({ where: { id: data.storeId } }),
  ]);
  if (
    !company?.active ||
    !zone?.active ||
    zone.deletedAt ||
    !store?.active ||
    store.companyId !== data.companyId ||
    store.zoneId !== data.zoneId
  )
    throw new ValidationError('Empresa, zona o tienda inválida para el asesor');
}

export async function listUsers(
  prisma: PrismaClient,
  query: { page: number; pageSize: number; q?: string; role?: Role },
) {
  const where: Prisma.UserWhereInput = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.q
      ? {
          OR: [
            { email: { contains: query.q, mode: 'insensitive' } },
            { firstName: { contains: query.q, mode: 'insensitive' } },
            { lastName: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const [total, data, companies, zones, stores] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: safeUserSelect,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.company.findMany({
      where: { active: true },
      select: { id: true, name: true },
    }),
    prisma.zone.findMany({
      where: { active: true, deletedAt: null },
      select: { id: true, name: true },
    }),
    prisma.store.findMany({
      where: { active: true },
      select: { id: true, name: true, companyId: true, zoneId: true },
    }),
  ]);
  return {
    data,
    options: { companies, zones, stores },
    meta: pageMeta(total, query.page, query.pageSize),
  };
}

/** La contraseña temporal se devuelve una sola vez y nunca se audita. */
export async function createUser(
  prisma: PrismaClient,
  actor: AuthUser,
  input: CreateUserInput,
  context: RequestContext,
) {
  const temporaryPassword = randomBytes(18).toString('base64url');
  const passwordHash = await argon2.hash(temporaryPassword);
  try {
    const user = await prisma.$transaction(async (tx) => {
      await validateScope(tx, input);
      const created = await tx.user.create({
        data: { ...input, passwordHash, mustChangePassword: true },
        select: safeUserSelect,
      });
      await log(tx, {
        actorId: actor.id,
        actorRole: actor.role,
        action: 'user.create',
        entityType: 'User',
        entityId: created.id,
        after: {
          email: created.email,
          role: created.role,
          companyId: created.companyId,
          zoneId: created.zoneId,
          storeId: created.storeId,
        },
        ...context,
      });
      return created;
    });
    return { user, temporaryPassword };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new ConflictError('Correo ya registrado');
    throw error;
  }
}

export async function updateUser(
  prisma: PrismaClient,
  actor: AuthUser,
  id: string,
  input: UpdateUserInput,
  context: RequestContext,
) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
    if (!before) throw new NotFoundError('Usuario no encontrado');
    if (
      id === actor.id &&
      (input.active === false || (input.role && input.role !== 'ADMIN'))
    )
      throw new ForbiddenError('No puedes desactivar o degradar tu cuenta');
    const scope = {
      role: input.role ?? before.role,
      companyId:
        input.companyId === undefined ? before.companyId : input.companyId,
      zoneId: input.zoneId === undefined ? before.zoneId : input.zoneId,
      storeId: input.storeId === undefined ? before.storeId : input.storeId,
    };
    await validateScope(tx, scope);
    const after = await tx.user.update({
      where: { id },
      data: input,
      select: safeUserSelect,
    });
    await log(tx, {
      actorId: actor.id,
      actorRole: actor.role,
      action: input.active === false ? 'user.deactivate' : 'user.update',
      entityType: 'User',
      entityId: id,
      before: {
        email: before.email,
        role: before.role,
        active: before.active,
        companyId: before.companyId,
        zoneId: before.zoneId,
        storeId: before.storeId,
      },
      after: {
        email: after.email,
        role: after.role,
        active: after.active,
        companyId: after.companyId,
        zoneId: after.zoneId,
        storeId: after.storeId,
      },
      ...context,
    });
    return after;
  });
}

export async function resetPassword(
  prisma: PrismaClient,
  actor: AuthUser,
  id: string,
  context: RequestContext,
) {
  const temporaryPassword = randomBytes(18).toString('base64url');
  const passwordHash = await argon2.hash(temporaryPassword);
  const user = await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!before) throw new NotFoundError('Usuario no encontrado');
    const after = await tx.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
      select: safeUserSelect,
    });
    await log(tx, {
      actorId: actor.id,
      actorRole: actor.role,
      action: 'user.reset_password',
      entityType: 'User',
      entityId: id,
      after: { mustChangePassword: true },
      ...context,
    });
    return after;
  });
  return { user, temporaryPassword };
}

export async function updateProfile(
  prisma: PrismaClient,
  actor: AuthUser,
  input: ProfileInput,
  context: RequestContext,
) {
  return prisma.$transaction(async (tx) => {
    const after = await tx.user.update({
      where: { id: actor.id },
      data: input,
      select: safeUserSelect,
    });
    await log(tx, {
      actorId: actor.id,
      actorRole: actor.role,
      action: 'profile.update',
      entityType: 'User',
      entityId: actor.id,
      before: { firstName: actor.firstName, lastName: actor.lastName },
      after: { firstName: after.firstName, lastName: after.lastName },
      ...context,
    });
    return after;
  });
}
