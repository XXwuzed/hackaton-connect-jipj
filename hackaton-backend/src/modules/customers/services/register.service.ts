import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { Config } from '../../../shared/config';
import { ConflictError, NotFoundError } from '../../../shared/errors';
import type { Mailer } from '../../../shared/mailer';
import { logger } from '../../../shared/logger';
import { log } from '../../audit';
import type { RegisterInput } from '../customers.dto';
import type { RequestContext } from '../../auth/auth.types';
import { sendWelcomeEmail } from './send-welcome.service';

/** Inscribe una cédula única y envía bienvenida después del commit. */
export async function registerCustomer(
  prisma: PrismaClient,
  mailer: Mailer,
  config: Config,
  input: RegisterInput,
  context: RequestContext,
) {
  const store = await prisma.store.findUnique({
    where: { code: input.storeCode },
    select: {
      id: true,
      zoneId: true,
      active: true,
      zone: { select: { active: true, deletedAt: true } },
      company: { select: { active: true } },
    },
  });
  if (
    !store?.active ||
    !store.zone.active ||
    store.zone.deletedAt ||
    !store.company.active
  ) {
    throw new NotFoundError('Tienda no disponible');
  }
  const existing = await prisma.customer.findUnique({
    where: { nationalId: input.nationalId },
    select: { id: true },
  });
  if (existing)
    throw new ConflictError(
      'No se pudo completar la inscripción',
      'REGISTRATION_REJECTED',
    );
  let customer;
  try {
    customer = await prisma.$transaction(async (tx) => {
      const created = await tx.customer.create({
        data: {
          nationalId: input.nationalId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          registeredStoreId: store.id,
          zoneId: store.zoneId,
          consentAt: new Date(),
          consentVersion: config.CONSENT_VERSION,
        },
      });
      await log(tx, {
        actorId: null,
        actorRole: null,
        action: 'customer.register',
        entityType: 'Customer',
        entityId: created.id,
        after: {
          status: 'ACTIVE',
          storeId: store.id,
          consentVersion: config.CONSENT_VERSION,
        },
        ...context,
      });
      return created;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictError(
        'No se pudo completar la inscripción',
        'REGISTRATION_REJECTED',
      );
    }
    throw error;
  }
  try {
    await sendWelcomeEmail(mailer, config, customer);
  } catch (error) {
    logger.error(
      { err: error, customerId: customer.id },
      'No se pudo enviar bienvenida',
    );
  }
  return { id: customer.id };
}
