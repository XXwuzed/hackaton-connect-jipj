import type { PrismaClient } from '@prisma/client';
import type { AuthUser, RequestContext } from '../auth/auth.types';
import { log } from '../audit';

export async function getLoyalty(prisma: PrismaClient) {
  return (
    (await prisma.loyaltySettings.findUnique({ where: { id: 1 } })) ?? {
      id: 1,
      pointsPerDollar: 5,
      updatedById: null,
      updatedAt: null,
    }
  );
}

/** El factor es informativo y no modifica lotes ni canjes. */
export async function updateLoyalty(
  prisma: PrismaClient,
  actor: AuthUser,
  pointsPerDollar: number,
  context: RequestContext,
) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.loyaltySettings.findUnique({ where: { id: 1 } });
    const after = await tx.loyaltySettings.upsert({
      where: { id: 1 },
      update: { pointsPerDollar, updatedById: actor.id },
      create: { id: 1, pointsPerDollar, updatedById: actor.id },
    });
    await log(tx, {
      actorId: actor.id,
      actorRole: actor.role,
      action: 'settings.update',
      entityType: 'LoyaltySettings',
      entityId: '1',
      before: { pointsPerDollar: before?.pointsPerDollar ?? 5 },
      after: { pointsPerDollar },
      ...context,
    });
    return after;
  });
}
