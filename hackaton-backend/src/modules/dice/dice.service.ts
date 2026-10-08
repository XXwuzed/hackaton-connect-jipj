import { Prisma, type PrismaClient } from '@prisma/client';
import type { AuthUser, RequestContext } from '../auth/auth.types';
import { log } from '../audit';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../shared/errors';
import { pageMeta } from '../../shared/page';
import { imageUrl } from '../../shared/image';
import type { Storage } from '../../shared/storage';
import { localStart, nextLocalDay } from '../../shared/queries';
import type {
  CreatePrizeInput,
  CreateRollInput,
  UpdatePrizeInput,
} from './dice.dto';

async function validZones(tx: Prisma.TransactionClient, ids: string[]) {
  const unique = [...new Set(ids)];
  const count = await tx.zone.count({
    where: { id: { in: unique }, active: true, deletedAt: null },
  });
  if (count !== unique.length)
    throw new ConflictError('Zona inactiva o eliminada', 'ZONE_UNAVAILABLE');
  return unique;
}

export async function listPrizes(
  prisma: PrismaClient,
  storage: Storage,
  actor: AuthUser,
  query: {
    page: number;
    pageSize: number;
    q?: string;
    companyId?: string;
    active?: 'true' | 'false';
  },
) {
  if (
    actor.role === 'ADVISOR' &&
    (!actor.companyId || !actor.zoneId || !actor.storeId)
  )
    throw new ForbiddenError('Asesor sin ámbito');
  const where: Prisma.DicePrizeWhereInput = {
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
    prisma.dicePrize.count({ where }),
    prisma.dicePrize.findMany({
      where,
      include: {
        product: true,
        zones: {
          include: {
            zone: { select: { name: true, active: true, deletedAt: true } },
          },
        },
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { product: { name: 'asc' } },
    }),
  ]);
  return {
    data: await Promise.all(
      rows.map(async (row) => ({
        ...row,
        product: {
          ...row.product,
          imageUrl: await imageUrl(storage, row.product.imageKey),
        },
      })),
    ),
    meta: pageMeta(total, query.page, query.pageSize),
  };
}

export async function createPrize(
  prisma: PrismaClient,
  actor: AuthUser,
  input: CreatePrizeInput,
  context: RequestContext,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: input.productId },
      });
      if (!product?.active) throw new NotFoundError('Producto no disponible');
      const zoneIds = await validZones(tx, input.zoneIds);
      const prize = await tx.dicePrize.create({
        data: {
          productId: input.productId,
          active: input.active,
          zones: { create: zoneIds.map((zoneId) => ({ zoneId })) },
        },
      });
      await log(tx, {
        actorId: actor.id,
        actorRole: actor.role,
        action: 'dice_prize.create',
        entityType: 'DicePrize',
        entityId: prize.id,
        after: { productId: prize.productId, active: prize.active, zoneIds },
        ...context,
      });
      return prize;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new ConflictError('Producto ya registrado como premio');
    throw error;
  }
}

export async function updatePrize(
  prisma: PrismaClient,
  actor: AuthUser,
  id: string,
  input: UpdatePrizeInput,
  context: RequestContext,
) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.dicePrize.findUnique({
      where: { id },
      include: { zones: true },
    });
    if (!before) throw new NotFoundError('Premio no encontrado');
    const zoneIds = input.zoneIds
      ? await validZones(tx, input.zoneIds)
      : undefined;
    if (input.active === true) {
      await validZones(tx, zoneIds ?? before.zones.map((zone) => zone.zoneId));
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
    const after = await tx.dicePrize.update({
      where: { id },
      data: {
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
      action: 'dice_prize.update',
      entityType: 'DicePrize',
      entityId: id,
      before: {
        active: before.active,
        zoneIds: before.zones.map((zone) => zone.zoneId),
      },
      after: {
        active: after.active,
        zoneIds: after.zones.map((zone) => zone.zoneId),
      },
      ...context,
    });
    return after;
  });
}

/** Registra dados físicos: el resultado ganador se decide solo aquí. */
export async function createRoll(
  prisma: PrismaClient,
  actor: AuthUser,
  input: CreateRollInput,
  context: RequestContext,
) {
  if (
    actor.role !== 'ADVISOR' ||
    !actor.companyId ||
    !actor.zoneId ||
    !actor.storeId
  )
    throw new ForbiddenError('Asesor sin tienda, empresa o zona');
  const companyId = actor.companyId,
    zoneId = actor.zoneId,
    storeId = actor.storeId;
  const winner = input.die1 === 6 && input.die2 === 6;
  if (winner && !input.prizeProductId)
    throw new ValidationError('Debes elegir un premio');
  if (!winner && input.prizeProductId)
    throw new ValidationError('No corresponde un premio');
  const ids = input.purchasedItems.map((item) => item.productId);
  if (new Set(ids).size !== ids.length)
    throw new ValidationError('Producto comprado repetido');
  try {
    return await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: input.customerId },
        select: { status: true, diceRoll: { select: { id: true } } },
      });
      if (!customer) throw new NotFoundError('Cliente no encontrado');
      if (customer.status !== 'ACTIVE')
        throw new ConflictError(
          'El cliente no está activo',
          'CUSTOMER_INACTIVE',
        );
      if (customer.diceRoll)
        throw new ConflictError(
          'Este cliente ya tiró los dados',
          'ALREADY_ROLLED',
        );
      const products = await tx.product.findMany({
        where: { id: { in: ids }, active: true, companyId },
      });
      if (products.length !== ids.length)
        throw new ConflictError(
          'Producto comprado fuera de la empresa o inactivo',
          'PRODUCT_UNAVAILABLE',
        );
      if (winner) {
        const prize = await tx.dicePrize.findUnique({
          where: { productId: input.prizeProductId },
          include: { product: true, zones: { include: { zone: true } } },
        });
        if (
          !prize?.active ||
          !prize.product.active ||
          prize.product.companyId !== companyId ||
          !prize.zones.some(
            (zone) =>
              zone.zoneId === zoneId &&
              zone.zone.active &&
              !zone.zone.deletedAt,
          )
        )
          throw new ConflictError(
            'Premio no disponible en tu zona',
            'PRIZE_UNAVAILABLE',
          );
      }
      const roll = await tx.diceRoll.create({
        data: {
          customerId: input.customerId,
          advisorId: actor.id,
          companyId,
          storeId,
          die1: input.die1,
          die2: input.die2,
          isWinner: winner,
          purchaseAmount: input.purchaseAmount,
          prizeProductId: winner ? input.prizeProductId : null,
          purchasedItems: { create: input.purchasedItems },
        },
        include: { purchasedItems: true },
      });
      await log(tx, {
        actorId: actor.id,
        actorRole: actor.role,
        action: 'dice.create',
        entityType: 'DiceRoll',
        entityId: roll.id,
        after: {
          customerId: roll.customerId,
          die1: roll.die1,
          die2: roll.die2,
          isWinner: winner,
          prizeProductId: roll.prizeProductId,
        },
        ...context,
      });
      return roll;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new ConflictError(
        'Este cliente ya tiró los dados',
        'ALREADY_ROLLED',
      );
    throw error;
  }
}

export async function listRolls(
  prisma: PrismaClient,
  query: {
    page: number;
    pageSize: number;
    from?: string;
    to?: string;
    customerId?: string;
    companyId?: string;
    q?: string;
  },
) {
  const where: Prisma.DiceRollWhereInput = {
    ...(query.customerId ? { customerId: query.customerId } : {}),
    ...(query.companyId ? { companyId: query.companyId } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: localStart(query.from) } : {}),
            ...(query.to ? { lt: nextLocalDay(query.to) } : {}),
          },
        }
      : {}),
    ...(query.q
      ? {
          customer: {
            OR: [
              { nationalId: { contains: query.q } },
              { email: { contains: query.q, mode: 'insensitive' } },
              { firstName: { contains: query.q, mode: 'insensitive' } },
              { lastName: { contains: query.q, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
  };
  const [total, data] = await Promise.all([
    prisma.diceRoll.count({ where }),
    prisma.diceRoll.findMany({
      where,
      include: {
        customer: {
          select: { firstName: true, lastName: true, nationalId: true },
        },
        advisor: { select: { firstName: true, lastName: true } },
        prizeProduct: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return { data, meta: pageMeta(total, query.page, query.pageSize) };
}

export async function getRoll(prisma: PrismaClient, id: string) {
  const roll = await prisma.diceRoll.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
          nationalId: true,
          email: true,
        },
      },
      advisor: { select: { firstName: true, lastName: true } },
      store: { select: { name: true } },
      prizeProduct: { select: { name: true } },
      purchasedItems: {
        include: { product: { select: { name: true, sku: true } } },
      },
    },
  });
  if (!roll) throw new NotFoundError('Tirada no encontrada');
  return roll;
}
