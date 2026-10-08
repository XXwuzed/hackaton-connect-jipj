import { Prisma, type PrismaClient } from '@prisma/client';
import { pageMeta } from '../../shared/page';

function monthBounds(month: string) {
  const [year, number] = month.split('-').map(Number);
  return {
    from: new Date(Date.UTC(year!, number! - 1, 1, 5)),
    to: new Date(Date.UTC(year!, number!, 1, 5)),
  };
}

export async function getSummary(prisma: PrismaClient, month: string) {
  const { from, to } = monthBounds(month);
  const [registered, unsubscribed, redeemed] = await Promise.all([
    prisma.customer.count({ where: { createdAt: { gte: from, lt: to } } }),
    prisma.customer.count({ where: { unsubscribedAt: { gte: from, lt: to } } }),
    prisma.redemption.aggregate({
      where: { redeemedAt: { gte: from, lt: to } },
      _sum: { pointsCost: true },
    }),
  ]);
  return {
    month,
    registered,
    unsubscribed,
    pointsRedeemed: redeemed._sum.pointsCost ?? 0,
  };
}

export async function getRotation(
  prisma: PrismaClient,
  query: {
    page: number;
    pageSize: number;
    q?: string;
    companyId?: string;
    order: 'units_asc' | 'units_desc' | 'margin_asc' | 'margin_desc';
  },
) {
  const where: Prisma.ProductSalesSummaryWhereInput = {
    product: {
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { sku: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
  };
  const [field, direction] = query.order.split('_') as [
    'units' | 'margin',
    'asc' | 'desc',
  ];
  const orderBy =
    field === 'units' ? { unitsSold: direction } : { margin: direction };
  const [total, data] = await Promise.all([
    prisma.productSalesSummary.count({ where }),
    prisma.productSalesSummary.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            companyId: true,
            pvp: true,
          },
        },
      },
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return { data, meta: pageMeta(total, query.page, query.pageSize) };
}
