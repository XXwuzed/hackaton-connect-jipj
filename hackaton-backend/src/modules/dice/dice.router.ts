import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../../shared/config';
import type { Storage } from '../../shared/storage';
import { authenticate } from '../../shared/middlewares/authenticate';
import { authorize } from '../../shared/middlewares/authorize';
import { validateBody } from '../../shared/middlewares/validate';
import { hasPermission } from '../../shared/authz/permissions';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors';
import { idSchema, parseQuery } from '../../shared/queries';
import {
  diceQuerySchema,
  prizeQuerySchema,
  createPrizeSchema,
  updatePrizeSchema,
  createRollSchema,
} from './dice.dto';
import {
  createPrize,
  createRoll,
  getRoll,
  listPrizes,
  listRolls,
  updatePrize,
} from './dice.service';

export function createDiceRouter(
  prisma: PrismaClient,
  config: Config,
  storage: Storage,
): Router {
  const router = Router();
  router.use(authenticate(prisma, config));
  router.get('/prizes', async (request, response, next) => {
    try {
      const actor = request.authUser;
      if (!actor) throw new UnauthorizedError();
      if (
        !hasPermission(actor.role, 'dice-prizes:read') &&
        !hasPermission(actor.role, 'dice-prizes:manage')
      )
        throw new ForbiddenError();
      response.json(
        await listPrizes(
          prisma,
          storage,
          actor,
          parseQuery(prizeQuerySchema, request.query),
        ),
      );
    } catch (error) {
      next(error);
    }
  });
  router.post(
    '/prizes',
    authorize('dice-prizes:manage'),
    validateBody(createPrizeSchema),
    async (request, response, next) => {
      try {
        response.status(201).json(
          await createPrize(prisma, request.authUser!, request.body, {
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
    '/prizes/:id',
    authorize('dice-prizes:manage'),
    validateBody(updatePrizeSchema),
    async (request, response, next) => {
      try {
        response.json(
          await updatePrize(
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
  router.get(
    '/rolls',
    authorize('dice:read'),
    async (request, response, next) => {
      try {
        response.json(
          await listRolls(prisma, parseQuery(diceQuerySchema, request.query)),
        );
      } catch (error) {
        next(error);
      }
    },
  );
  router.get(
    '/rolls/:id',
    authorize('dice:read'),
    async (request, response, next) => {
      try {
        response.json(
          await getRoll(prisma, parseQuery(idSchema, request.params.id)),
        );
      } catch (error) {
        next(error);
      }
    },
  );
  router.post(
    '/rolls',
    authorize('dice:create'),
    validateBody(createRollSchema),
    async (request, response, next) => {
      try {
        response.status(201).json(
          await createRoll(prisma, request.authUser!, request.body, {
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
