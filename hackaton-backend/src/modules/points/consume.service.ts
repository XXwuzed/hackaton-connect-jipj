import { Prisma, type Prisma as PrismaType } from '@prisma/client';
import { ConflictError } from '../../shared/errors';

type Lot = { id: string; pointsRemaining: number };

/** Bloquea lotes vigentes y los consume por vencimiento/antigüedad. */
export async function consumePoints(
  tx: PrismaType.TransactionClient,
  customerId: string,
  costs: Array<{ redemptionId: string; points: number }>,
  now: Date,
) {
  const lots = await tx.$queryRaw<Lot[]>(Prisma.sql`
    SELECT id, "pointsRemaining" FROM "PointsLot"
    WHERE "customerId" = ${customerId} AND "expiresAt" > ${now} AND "pointsRemaining" > 0
    ORDER BY "expiresAt" ASC, "earnedAt" ASC, id ASC FOR UPDATE
  `);
  const total = costs.reduce((sum, item) => sum + item.points, 0);
  if (lots.reduce((sum, lot) => sum + lot.pointsRemaining, 0) < total)
    throw new ConflictError(
      'Saldo de puntos insuficiente',
      'INSUFFICIENT_POINTS',
    );
  let index = 0;
  for (const cost of costs) {
    let left = cost.points;
    while (left > 0) {
      const lot = lots[index];
      if (!lot)
        throw new ConflictError(
          'Saldo de puntos insuficiente',
          'INSUFFICIENT_POINTS',
        );
      const used = Math.min(left, lot.pointsRemaining);
      await tx.pointsLot.update({
        where: { id: lot.id },
        data: { pointsRemaining: { decrement: used } },
      });
      await tx.pointsLotUsage.create({
        data: { redemptionId: cost.redemptionId, lotId: lot.id, points: used },
      });
      lot.pointsRemaining -= used;
      left -= used;
      if (lot.pointsRemaining === 0) index++;
    }
  }
}
