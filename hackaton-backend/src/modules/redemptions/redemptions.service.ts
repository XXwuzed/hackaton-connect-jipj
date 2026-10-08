import { Prisma, type PrismaClient } from '@prisma/client';
import type { AuthUser, RequestContext } from '../auth/auth.types';
import { log } from '../audit';
import { consumePoints } from '../points';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors';
import { assertResourceScope } from '../../shared/authz/policies';
import {
  guayaquilDate,
  startOfMonthGuayaquil,
  endOfMonthGuayaquil,
} from '../../shared/time';
import { localStart, nextLocalDay } from '../../shared/queries';
import { pageMeta } from '../../shared/page';
import type { CreateRedemptionInput, RedemptionQuery } from './redemptions.dto';

/** Canjea uno o dos productos de modo atómico, serializado por cliente. */
export async function createRedemption(
  prisma: PrismaClient,
  actor: AuthUser,
  input: CreateRedemptionInput,
  context: RequestContext,
) {
  if (
    actor.role !== 'ADVISOR' ||
    !actor.companyId ||
    !actor.zoneId ||
    !actor.storeId
  )
    throw new ForbiddenError('Asesor sin tienda, empresa o zona');
  const companyId = actor.companyId;
  const zoneId = actor.zoneId;
  const storeId = actor.storeId;
  const now = new Date();
  return prisma.$transaction(
    async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string; status: string }>>(
        Prisma.sql`SELECT id, status FROM "Customer" WHERE id = ${input.customerId} FOR UPDATE`,
      );
      if (!locked[0]) throw new NotFoundError('Cliente no encontrado');
      if (locked[0].status !== 'ACTIVE')
        throw new ConflictError(
          'El cliente no está activo',
          'CUSTOMER_INACTIVE',
        );
      const products = await tx.redeemableProduct.findMany({
        where: { productId: { in: input.productIds } },
        include: { product: true, zones: { include: { zone: true } } },
      });
      for (const id of input.productIds) {
        const item = products.find((product) => product.productId === id);
        if (
          !item?.active ||
          !item.product.active ||
          !item.zones.some(
            (zone) =>
              zone.zoneId === zoneId &&
              zone.zone.active &&
              !zone.zone.deletedAt,
          )
        )
          throw new ConflictError(
            'Producto no disponible para canje',
            'PRODUCT_UNAVAILABLE',
          );
        assertResourceScope(actor, {
          companyId: item.product.companyId,
          zoneId,
        });
      }
      const dayCount = await tx.redemption.count({
        where: {
          customerId: input.customerId,
          redeemedDate: guayaquilDate(now),
        },
      });
      if (dayCount + input.productIds.length > 2)
        throw new ConflictError('Máximo dos canjes por día', 'DAILY_LIMIT');
      const monthStart = startOfMonthGuayaquil(now);
      const nextMonth = new Date(endOfMonthGuayaquil(now).getTime() + 1);
      for (const id of new Set(input.productIds)) {
        const previous = await tx.redemption.count({
          where: {
            customerId: input.customerId,
            productId: id,
            redeemedAt: { gte: monthStart, lt: nextMonth },
          },
        });
        if (
          previous +
            input.productIds.filter((candidate) => candidate === id).length >
          4
        )
          throw new ConflictError(
            'Máximo cuatro canjes del producto por mes',
            'MONTHLY_PRODUCT_LIMIT',
          );
      }
      const created = [];
      for (const id of input.productIds) {
        const item = products.find((product) => product.productId === id)!;
        created.push(
          await tx.redemption.create({
            data: {
              customerId: input.customerId,
              productId: id,
              advisorId: actor.id,
              companyId,
              storeId,
              pointsCost: item.pointsRequired,
              productName: item.product.name,
              redeemedAt: now,
              redeemedDate: guayaquilDate(now),
            },
          }),
        );
      }
      await consumePoints(
        tx,
        input.customerId,
        created.map((item) => ({
          redemptionId: item.id,
          points: item.pointsCost,
        })),
        now,
      );
      await log(tx, {
        actorId: actor.id,
        actorRole: actor.role,
        action: 'redemption.create',
        entityType: 'Redemption',
        entityId: created[0]!.id,
        after: {
          redemptionIds: created.map((item) => item.id),
          customerId: input.customerId,
          productIds: input.productIds,
        },
        ...context,
      });
      return { data: created };
    },
    { timeout: 15000 },
  );
}

/** Consulta el historial global con filtros estables. */
export async function listRedemptions(
  prisma: PrismaClient,
  query: RedemptionQuery,
) {
  const where: Prisma.RedemptionWhereInput = {
    ...(query.customerId ? { customerId: query.customerId } : {}),
    ...(query.companyId ? { companyId: query.companyId } : {}),
    ...(query.from || query.to
      ? {
          redeemedAt: {
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
    prisma.redemption.count({ where }),
    prisma.redemption.findMany({
      where,
      include: {
        customer: {
          select: { firstName: true, lastName: true, nationalId: true },
        },
        advisor: { select: { firstName: true, lastName: true } },
        store: { select: { name: true } },
      },
      orderBy: { redeemedAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return { data, meta: pageMeta(total, query.page, query.pageSize) };
}

export async function getRedemption(prisma: PrismaClient, id: string) {
  const result = await prisma.redemption.findUnique({
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
      lotUsages: {
        include: { lot: { select: { earnedAt: true, expiresAt: true } } },
      },
    },
  });
  if (!result) throw new NotFoundError('Canje no encontrado');
  return result;
}
