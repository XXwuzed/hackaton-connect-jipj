import type { Prisma, PrismaClient } from '@prisma/client';

type Database = PrismaClient | Prisma.TransactionClient;

/** Agrega saldos vigentes para varios clientes en una sola consulta. */
export async function getBalances(
  prisma: Database,
  customerIds: string[],
  now = new Date(),
): Promise<Map<string, number>> {
  if (customerIds.length === 0) return new Map();
  const rows = await prisma.pointsLot.groupBy({
    by: ['customerId'],
    where: {
      customerId: { in: customerIds },
      expiresAt: { gt: now },
      pointsRemaining: { gt: 0 },
    },
    _sum: { pointsRemaining: true },
  });
  return new Map(
    rows.map((row) => [row.customerId, row._sum.pointsRemaining ?? 0]),
  );
}

/** Consulta el saldo vigente de un cliente. */
export async function getBalance(
  prisma: Database,
  customerId: string,
  now = new Date(),
): Promise<number> {
  return (await getBalances(prisma, [customerId], now)).get(customerId) ?? 0;
}
