import { Prisma, type PrismaClient } from '@prisma/client';
import type { AuthUser, RequestContext } from '../auth/auth.types';
import { log } from '../audit';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors';
import { imageUrl } from '../../shared/image';
import type { Storage } from '../../shared/storage';
import { pageMeta } from '../../shared/page';
import type {
  BulkAssignInput,
  CreateRedeemableInput,
  UpdateRedeemableInput,
} from './redeemable.dto';

async function assertZones(tx: Prisma.TransactionClient, zoneIds: string[]) {
  const unique = [...new Set(zoneIds)];
  const zones = await tx.zone.findMany({
    where: { id: { in: unique }, active: true, deletedAt: null },
  });
  if (zones.length !== unique.length)
    throw new ConflictError('Zona inactiva o eliminada', 'ZONE_UNAVAILABLE');
  return unique;
}

export async function listRedeemables(
  prisma: PrismaClient,
  storage: Storage,
  actor: AuthUser,
  query: {
    q?: string;
    companyId?: string;
    active?: 'true' | 'false';
    page: number;
    pageSize: number;
  },
) {
  if (
    actor.role === 'ADVISOR' &&
    (!actor.companyId || !actor.zoneId || !actor.storeId)
  )
    throw new ForbiddenError('Asesor sin ámbito');
  const where: Prisma.RedeemableProductWhereInput = {
    ...(actor.role === 'ADVISOR'
      ? {
          active: true,
          product: { active: true, companyId: actor.companyId! },
          zones: {
            some: {
              zoneId: actor.zoneId!,
              zone: { active: true, deletedAt: null },
            },
          },
        }
      : {
          ...(query.companyId
            ? { product: { companyId: query.companyId } }
            : {}),
          ...(query.active ? { active: query.active === 'true' } : {}),
        }),
    ...(query.q
      ? {
          product: {
            name: { contains: query.q, mode: 'insensitive' },
            ...(actor.role === 'ADVISOR'
              ? { active: true, companyId: actor.companyId! }
              : query.companyId
                ? { companyId: query.companyId }
                : {}),
          },
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.redeemableProduct.count({ where }),
    prisma.redeemableProduct.findMany({
      where,
      include: {
        product: true,
        zones: {
          include: {
            zone: { select: { name: true, active: true, deletedAt: true } },
          },
        },
      },
      orderBy: { product: { name: 'asc' } },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  const data = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      product: {
        ...row.product,
        imageUrl: await imageUrl(storage, row.product.imageKey),
      },
    })),
  );
  return { data, meta: pageMeta(total, query.page, query.pageSize) };
}

export async function createRedeemable(
  prisma: PrismaClient,
  actor: AuthUser,
  input: CreateRedeemableInput,
  context: RequestContext,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: input.productId },
      });
      if (!product?.active) throw new NotFoundError('Producto no disponible');
      const zoneIds = await assertZones(tx, input.zoneIds);
      const created = await tx.redeemableProduct.create({
        data: {
          productId: input.productId,
          pointsRequired: input.pointsRequired,
          discountPercent: input.discountPercent ?? null,
          zones: { create: zoneIds.map((zoneId) => ({ zoneId })) },
        },
      });
      await log(tx, {
        actorId: actor.id,
        actorRole: actor.role,
        action: 'redeemable_product.create',
        entityType: 'RedeemableProduct',
        entityId: created.id,
        after: {
          productId: input.productId,
          pointsRequired: input.pointsRequired,
          zoneIds,
        },
        ...context,
      });
      return created;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new ConflictError('Producto ya vinculado');
    throw error;
  }
}

export async function updateRedeemable(
  prisma: PrismaClient,
  actor: AuthUser,
  id: string,
  input: UpdateRedeemableInput,
  context: RequestContext,
) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.redeemableProduct.findUnique({
      where: { id },
      include: { zones: true },
    });
    if (!before) throw new NotFoundError('Canjeable no encontrado');
    const zoneIds = input.zoneIds
      ? await assertZones(tx, input.zoneIds)
      : undefined;
    if (input.active === true) {
      await assertZones(tx, zoneIds ?? before.zones.map((zone) => zone.zoneId));
      const product = await tx.product.findUnique({
        where: { id: before.productId },
        select: { active: true },
      });
      if (!product?.active)
        throw new ConflictError(
          'Producto del catálogo inactivo',
          'PRODUCT_UNAVAILABLE',
        );
    }
    const after = await tx.redeemableProduct.update({
      where: { id },
      data: {
        pointsRequired: input.pointsRequired,
        discountPercent: input.discountPercent,
        active: input.active,
        ...(zoneIds
          ? {
              zones: {
                deleteMany: {},
                create: zoneIds.map((zoneId) => ({ zoneId })),
              },
            }
          : {}),
      },
      include: { zones: true },
    });
    await log(tx, {
      actorId: actor.id,
      actorRole: actor.role,
      action:
        input.active === false
          ? 'redeemable_product.deactivate'
          : 'redeemable_product.update',
      entityType: 'RedeemableProduct',
      entityId: id,
      before: {
        pointsRequired: before.pointsRequired,
        active: before.active,
        zoneIds: before.zones.map((zone) => zone.zoneId),
      },
      after: {
        pointsRequired: after.pointsRequired,
        active: after.active,
        zoneIds: after.zones.map((zone) => zone.zoneId),
      },
      ...context,
    });
    return after;
  });
}

export async function bulkAssignZone(
  prisma: PrismaClient,
  actor: AuthUser,
  input: BulkAssignInput,
  context: RequestContext,
) {
  return prisma.$transaction(async (tx) => {
    await assertZones(tx, [input.zoneId]);
    const ids = [...new Set(input.redeemableProductIds)];
    if (
      (await tx.redeemableProduct.count({ where: { id: { in: ids } } })) !==
      ids.length
    )
      throw new NotFoundError('Canjeable no encontrado');
    for (const id of ids)
      await tx.redeemableProductZone.upsert({
        where: {
          redeemableProductId_zoneId: {
            redeemableProductId: id,
            zoneId: input.zoneId,
          },
        },
        update: {},
        create: { redeemableProductId: id, zoneId: input.zoneId },
      });
    await log(tx, {
      actorId: actor.id,
      actorRole: actor.role,
      action: 'redeemable_product.bulk_assign',
      entityType: 'RedeemableProduct',
      after: { ids, zoneId: input.zoneId },
      ...context,
    });
    return { assigned: ids.length };
  });
}
