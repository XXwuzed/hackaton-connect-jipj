import { Prisma, type PrismaClient } from '@prisma/client';
import type { AuthUser } from '../../auth/auth.types';
import { getBalances } from '../../points';
import { ForbiddenError } from '../../../shared/errors';
import { pageMeta } from '../../../shared/page';
import type { CustomersQuery } from '../customers.dto';

function localStart(value: string): Date {
  return new Date(`${value}T05:00:00.000Z`);
}

function nextDay(value: string): Date {
  return new Date(localStart(value).getTime() + 86_400_000);
}

/** Lista clientes con filtro ABAC por zona y saldos agregados. */
export async function listCustomers(
  prisma: PrismaClient,
  actor: AuthUser,
  query: CustomersQuery,
) {
  if (actor.role === 'ADVISOR' && !actor.zoneId)
    throw new ForbiddenError('Asesor sin zona');
  const zoneId =
    actor.role === 'ADVISOR' && query.scope === 'zone' ? actor.zoneId : null;
  const where: Prisma.CustomerWhereInput = {
    ...(zoneId ? { zoneId } : {}),
    ...(query.q
      ? {
          OR: [
            { nationalId: { contains: query.q } },
            { email: { contains: query.q, mode: 'insensitive' } },
            { firstName: { contains: query.q, mode: 'insensitive' } },
            { lastName: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: localStart(query.from) } : {}),
            ...(query.to ? { lt: nextDay(query.to) } : {}),
          },
        }
      : {}),
  };
  const total = await prisma.customer.count({ where });
  const skip = (query.page - 1) * query.pageSize;
  let ids: string[] | undefined;
  if (query.order === 'points_desc') {
    const clauses: Prisma.Sql[] = [Prisma.sql`TRUE`];
    if (zoneId) clauses.push(Prisma.sql`c."zoneId" = ${zoneId}`);
    if (query.q) {
      const term = `%${query.q}%`;
      clauses.push(
        Prisma.sql`(c."nationalId" ILIKE ${term} OR c.email ILIKE ${term} OR c."firstName" ILIKE ${term} OR c."lastName" ILIKE ${term})`,
      );
    }
    if (query.from)
      clauses.push(Prisma.sql`c."createdAt" >= ${localStart(query.from)}`);
    if (query.to)
      clauses.push(Prisma.sql`c."createdAt" < ${nextDay(query.to)}`);
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT c.id FROM "Customer" c
      LEFT JOIN "PointsLot" p ON p."customerId" = c.id AND p."expiresAt" > ${new Date()} AND p."pointsRemaining" > 0
      WHERE ${Prisma.join(clauses, ' AND ')}
      GROUP BY c.id ORDER BY COALESCE(SUM(p."pointsRemaining"), 0) DESC, MAX(c."createdAt") DESC
      LIMIT ${query.pageSize} OFFSET ${skip}
    `);
    ids = rows.map((row) => row.id);
  }
  const customers = await prisma.customer.findMany({
    where: ids ? { id: { in: ids } } : where,
    select: {
      id: true,
      nationalId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      status: true,
      zoneId: true,
      createdAt: true,
    },
    ...(ids
      ? {}
      : {
          orderBy: { createdAt: 'desc' as const },
          skip,
          take: query.pageSize,
        }),
  });
  if (ids)
    customers.sort(
      (left, right) => ids!.indexOf(left.id) - ids!.indexOf(right.id),
    );
  const balances = await getBalances(
    prisma,
    customers.map((customer) => customer.id),
  );
  return {
    data: customers.map((customer) => ({
      ...customer,
      pointsBalance: balances.get(customer.id) ?? 0,
    })),
    meta: pageMeta(total, query.page, query.pageSize),
  };
}
