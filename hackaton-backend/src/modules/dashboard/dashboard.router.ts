import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../../shared/config';
import { authenticate } from '../../shared/middlewares/authenticate';
import { authorize } from '../../shared/middlewares/authorize';
import { parseQuery } from '../../shared/queries';
import { summaryQuerySchema, rotationQuerySchema } from './dashboard.dto';
import { getSummary, getRotation } from './dashboard.service';

export function createDashboardRouter(
  prisma: PrismaClient,
  config: Config,
): Router {
  const router = Router();
  router.use(authenticate(prisma, config));
  router.get(
    '/summary',
    authorize('dashboard:read'),
    async (request, response, next) => {
      try {
        response.json(
          await getSummary(
            prisma,
            parseQuery(summaryQuerySchema, request.query).month,
          ),
        );
      } catch (error) {
        next(error);
      }
    },
  );
  router.get(
    '/product-rotation',
    authorize('product-rotation:read'),
    async (request, response, next) => {
      try {
        response.json(
          await getRotation(
            prisma,
            parseQuery(rotationQuerySchema, request.query),
          ),
        );
      } catch (error) {
        next(error);
      }
    },
  );
  return router;
}
