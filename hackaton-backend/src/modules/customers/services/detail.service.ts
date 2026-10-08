import type { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../../shared/errors';
import { getBalance } from '../../points';

/** Devuelve el cliente y su historial sin consultar los lotes uno a uno. */
export async function getCustomer(prisma: PrismaClient, id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      nationalId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      status: true,
      zoneId: true,
      registeredStoreId: true,
      consentAt: true,
      consentVersion: true,
      createdAt: true,
      unsubscribedAt: true,
      redemptions: {
        select: {
          id: true,
          productName: true,
          pointsCost: true,
          redeemedAt: true,
        },
        orderBy: { redeemedAt: 'desc' },
        take: 50,
      },
      diceRoll: {
        select: {
          id: true,
          die1: true,
          die2: true,
          isWinner: true,
          createdAt: true,
        },
      },
    },
  });
  if (!customer) throw new NotFoundError('Cliente no encontrado');
  return { ...customer, pointsBalance: await getBalance(prisma, id) };
}
