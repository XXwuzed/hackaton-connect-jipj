import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../shared/errors';

/** Publica solo el nombre de una tienda activa y su empresa. */
export function createStoresRouter(prisma: PrismaClient): Router {
  const router = Router();
  router.get('/:code', async (request, response, next) => {
    try {
      const store = await prisma.store.findUnique({
        where: { code: request.params.code },
        select: {
          name: true,
          active: true,
          zone: { select: { active: true, deletedAt: true } },
          company: { select: { name: true, active: true } },
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
      response.json({ name: store.name, company: store.company.name });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
