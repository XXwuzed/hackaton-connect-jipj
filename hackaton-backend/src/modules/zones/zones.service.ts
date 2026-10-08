import { Prisma, type PrismaClient } from '@prisma/client';
import type { AuthUser, RequestContext } from '../auth/auth.types';
import { log } from '../audit';
import { ConflictError, NotFoundError } from '../../shared/errors';
import { pageMeta } from '../../shared/page';
import type { CreateZoneInput, UpdateZoneInput } from './zones.dto';

export async function listZones(
  prisma: PrismaClient,
  query: {
    page: number;
    pageSize: number;
    q?: string;
    active?: 'true' | 'false';
  },
) {
  const where: Prisma.ZoneWhereInput = {
    deletedAt: null,
    ...(query.q ? { name: { contains: query.q, mode: 'insensitive' } } : {}),
    ...(query.active ? { active: query.active === 'true' } : {}),
  };
  const [total, data] = await Promise.all([
    prisma.zone.count({ where }),
    prisma.zone.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return { data, meta: pageMeta(total, query.page, query.pageSize) };
}

export async function createZone(
  prisma: PrismaClient,
  actor: AuthUser,
  input: CreateZoneInput,
  context: RequestContext,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const zone = await tx.zone.create({ data: input });
      await log(tx, {
        actorId: actor.id,
        actorRole: actor.role,
        action: 'zone.create',
        entityType: 'Zone',
        entityId: zone.id,
        after: input,
        ...context,
      });
      return zone;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new ConflictError('Nombre de zona duplicado');
    throw error;
  }
}

export async function updateZone(
  prisma: PrismaClient,
  actor: AuthUser,
  id: string,
  input: UpdateZoneInput,
  context: RequestContext,
) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.zone.findUnique({ where: { id } });
    if (!before || before.deletedAt)
      throw new NotFoundError('Zona no encontrada');
    const after = await tx.zone.update({ where: { id }, data: input });
    await log(tx, {
      actorId: actor.id,
      actorRole: actor.role,
      action: input.active === false ? 'zone.deactivate' : 'zone.update',
      entityType: 'Zone',
      entityId: id,
      before: {
        name: before.name,
        centerLat: String(before.centerLat),
        centerLng: String(before.centerLng),
        radiusMeters: before.radiusMeters,
        active: before.active,
      },
      after: {
        name: after.name,
        centerLat: String(after.centerLat),
        centerLng: String(after.centerLng),
        radiusMeters: after.radiusMeters,
        active: after.active,
      },
      ...context,
    });
    return after;
  });
}

export async function deleteZone(
  prisma: PrismaClient,
  actor: AuthUser,
  id: string,
  context: RequestContext,
) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.zone.findUnique({ where: { id } });
    if (!before || before.deletedAt)
      throw new NotFoundError('Zona no encontrada');
    const after = await tx.zone.update({
      where: { id },
      data: { active: false, deletedAt: new Date() },
    });
    await log(tx, {
      actorId: actor.id,
      actorRole: actor.role,
      action: 'zone.delete',
      entityType: 'Zone',
      entityId: id,
      before: { active: before.active },
      after: { active: false, deletedAt: after.deletedAt?.toISOString() },
      ...context,
    });
    return { id, deleted: true };
  });
}
