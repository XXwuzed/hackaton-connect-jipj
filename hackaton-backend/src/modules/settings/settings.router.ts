import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../../shared/config';
import { authenticate } from '../../shared/middlewares/authenticate';
import { authorize } from '../../shared/middlewares/authorize';
import { validateBody } from '../../shared/middlewares/validate';
import { loyaltySchema } from './settings.dto';
import { getLoyalty, updateLoyalty } from './settings.service';

export function createSettingsRouter(
  prisma: PrismaClient,
  config: Config,
): Router {
  const router = Router();
  router.use(authenticate(prisma, config), authorize('settings:update'));
  router.get('/loyalty', async (_request, response, next) => {
    try {
      response.json(await getLoyalty(prisma));
    } catch (error) {
      next(error);
    }
  });
  router.patch(
    '/loyalty',
    validateBody(loyaltySchema),
    async (request, response, next) => {
      try {
        response.json(
          await updateLoyalty(
            prisma,
            request.authUser!,
            request.body.pointsPerDollar,
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
  return router;
}
