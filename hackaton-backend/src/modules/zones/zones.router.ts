import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../../shared/config';
import { authenticate } from '../../shared/middlewares/authenticate';
import { authorize } from '../../shared/middlewares/authorize';
import { validateBody } from '../../shared/middlewares/validate';
import { idSchema, parseQuery } from '../../shared/queries';
import {
  zoneQuerySchema,
  createZoneSchema,
  updateZoneSchema,
} from './zones.dto';
import { createZone, deleteZone, listZones, updateZone } from './zones.service';

export function createZonesRouter(
  prisma: PrismaClient,
  config: Config,
): Router {
  const router = Router();
  router.use(authenticate(prisma, config), authorize('zones:manage'));
  router.get('/', async (request, response, next) => {
    try {
      response.json(
        await listZones(prisma, parseQuery(zoneQuerySchema, request.query)),
      );
    } catch (error) {
      next(error);
    }
  });
  router.post(
    '/',
    validateBody(createZoneSchema),
    async (request, response, next) => {
      try {
        response.status(201).json(
          await createZone(prisma, request.authUser!, request.body, {
            ip: request.ip ?? null,
            userAgent: request.get('user-agent') ?? null,
          }),
        );
      } catch (error) {
        next(error);
      }
    },
  );
  router.patch(
    '/:id',
    validateBody(updateZoneSchema),
    async (request, response, next) => {
      try {
        response.json(
          await updateZone(
            prisma,
            request.authUser!,
            parseQuery(idSchema, request.params.id),
            request.body,
            {
              ip: request.ip ?? null,
              userAgent: request.get('user-agent') ?? null,
            },
          ),
        );
      } catch (error) {
        next(error);
      }
    },
  );
  router.delete('/:id', async (request, response, next) => {
    try {
      response.json(
        await deleteZone(
          prisma,
          request.authUser!,
          parseQuery(idSchema, request.params.id),
          {
            ip: request.ip ?? null,
            userAgent: request.get('user-agent') ?? null,
          },
        ),
      );
    } catch (error) {
      next(error);
    }
  });
  return router;
}
