import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../../shared/config';
import { authenticate } from '../../shared/middlewares/authenticate';
import { authorize } from '../../shared/middlewares/authorize';
import { validateBody } from '../../shared/middlewares/validate';
import { UnauthorizedError } from '../../shared/errors';
import { idSchema, parseQuery } from '../../shared/queries';
import {
  createRedemptionSchema,
  redemptionQuerySchema,
} from './redemptions.dto';
import {
  createRedemption,
  getRedemption,
  listRedemptions,
} from './redemptions.service';

export function createRedemptionsRouter(
  prisma: PrismaClient,
  config: Config,
): Router {
  const router = Router();
  router.use(authenticate(prisma, config));
  router.get(
    '/',
    authorize('redemptions:read'),
    async (request, response, next) => {
      try {
        response.json(
          await listRedemptions(
            prisma,
            parseQuery(redemptionQuerySchema, request.query),
          ),
        );
      } catch (error) {
        next(error);
      }
    },
  );
  router.get(
    '/:id',
    authorize('redemptions:read'),
    async (request, response, next) => {
      try {
        response.json(
          await getRedemption(prisma, parseQuery(idSchema, request.params.id)),
        );
      } catch (error) {
        next(error);
      }
    },
  );
  router.post(
    '/',
    authorize('redemptions:create'),
    validateBody(createRedemptionSchema),
    async (request, response, next) => {
      try {
        if (!request.authUser) throw new UnauthorizedError();
        response.status(201).json(
          await createRedemption(prisma, request.authUser, request.body, {
            ip: request.ip ?? null,
            userAgent: request.get('user-agent') ?? null,
          }),
        );
      } catch (error) {
        next(error);
      }
    },
  );
  return router;
}
