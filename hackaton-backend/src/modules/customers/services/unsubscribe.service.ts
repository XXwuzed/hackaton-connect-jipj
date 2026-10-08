import type { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../../shared/errors';
import { log } from '../../audit';
import type { RequestContext } from '../../auth/auth.types';

function mask(value: string): string {
  return `${value.charAt(0)}***`;
}

/** Consulta el estado sin ejecutar una baja desde un GET. */
export async function getUnsubscribeInfo(prisma: PrismaClient, token: string) {
  const customer = await prisma.customer.findUnique({
    where: { unsubscribeToken: token },
    select: { firstName: true, lastName: true, status: true },
  });
  if (!customer) throw new NotFoundError('Enlace no válido');
  return {
    name: `${mask(customer.firstName)} ${mask(customer.lastName)}`,
    status: customer.status,
  };
}

/** Da de baja una sola vez y conserva el historial. */
export async function unsubscribeCustomer(
  prisma: PrismaClient,
  token: string,
  context: RequestContext,
) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { unsubscribeToken: token },
      select: { id: true, status: true },
    });
    if (!customer) throw new NotFoundError('Enlace no válido');
    if (customer.status === 'UNSUBSCRIBED')
      return { status: 'UNSUBSCRIBED' as const };
    const changed = await tx.customer.updateMany({
      where: { id: customer.id, status: 'ACTIVE' },
      data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
    });
    if (changed.count === 0) return { status: 'UNSUBSCRIBED' as const };
    await log(tx, {
      actorId: null,
      actorRole: null,
      action: 'customer.unsubscribe',
      entityType: 'Customer',
      entityId: customer.id,
      before: { status: 'ACTIVE' },
      after: { status: 'UNSUBSCRIBED' },
      ...context,
    });
    return { status: 'UNSUBSCRIBED' as const };
  });
}
