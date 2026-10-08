import { Prisma, type PrismaClient } from '@prisma/client';
import type { AuthUser, RequestContext } from '../auth/auth.types';
import { log } from '../audit';
import { ForbiddenError, NotFoundError } from '../../shared/errors';
import { pageMeta } from '../../shared/page';
import { imageUrl } from '../../shared/image';
import type { Storage } from '../../shared/storage';
import type { UpdateProductInput } from './products.dto';

export async function listProducts(
  prisma: PrismaClient,
  storage: Storage,
  actor: AuthUser,
  query: { page: number; pageSize: number; q?: string; companyId?: string },
) {
  if (
    actor.role === 'ADVISOR' &&
    (!actor.companyId || !actor.zoneId || !actor.storeId)
  )
    throw new ForbiddenError('Asesor sin ámbito');
  const where: Prisma.ProductWhereInput = {
    ...(actor.role === 'ADVISOR'
      ? { companyId: actor.companyId!, active: true }
      : query.companyId
        ? { companyId: query.companyId }
        : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { sku: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return {
    data: await Promise.all(
      rows.map(async (row) => ({
        ...row,
        imageUrl: await imageUrl(storage, row.imageKey),
      })),
    ),
    meta: pageMeta(total, query.page, query.pageSize),
  };
}

export async function getProduct(
  prisma: PrismaClient,
  storage: Storage,
  id: string,
) {
  const row = await prisma.product.findUnique({ where: { id } });
  if (!row) throw new NotFoundError('Producto no encontrado');
  return { ...row, imageUrl: await imageUrl(storage, row.imageKey) };
}

export async function updateProduct(
  prisma: PrismaClient,
  storage: Storage,
  actor: AuthUser,
  id: string,
  input: UpdateProductInput,
  context: RequestContext,
) {
  const row = await prisma.$transaction(async (tx) => {
    const before = await tx.product.findUnique({ where: { id } });
    if (!before) throw new NotFoundError('Producto no encontrado');
    const after = await tx.product.update({
      where: { id },
      data: { imageKey: input.imageKey, description: input.description },
    });
    await log(tx, {
      actorId: actor.id,
      actorRole: actor.role,
      action: 'product.update',
      entityType: 'Product',
      entityId: id,
      before: { imageKey: before.imageKey, description: before.description },
      after: { imageKey: after.imageKey, description: after.description },
      ...context,
    });
    return after;
  });
  return { ...row, imageUrl: await imageUrl(storage, row.imageKey) };
}
