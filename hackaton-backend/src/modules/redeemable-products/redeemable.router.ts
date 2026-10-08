import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../../shared/config';
import type { Storage } from '../../shared/storage';
import { authenticate } from '../../shared/middlewares/authenticate';
import { authorize } from '../../shared/middlewares/authorize';
import { validateBody } from '../../shared/middlewares/validate';
import { UnauthorizedError } from '../../shared/errors';
import { hasPermission } from '../../shared/authz/permissions';
import { idSchema, parseQuery } from '../../shared/queries';
import {
  redeemableQuerySchema,
  createRedeemableSchema,
  updateRedeemableSchema,
  bulkAssignSchema,
} from './redeemable.dto';
import {
  bulkAssignZone,
  createRedeemable,
  listRedeemables,
  updateRedeemable,
} from './redeemable.service';

export function createRedeemableRouter(
  prisma: PrismaClient,
  config: Config,
  storage: Storage,
): Router {
  const router = Router();
  router.use(authenticate(prisma, config));
  router.get('/', async (request, response, next) => {
    try {
      const actor = request.authUser;
      if (!actor) throw new UnauthorizedError();
      if (
        !hasPermission(actor.role, 'redeemable-products:read') &&
        !hasPermission(actor.role, 'redeemable-products:manage')
      )
        return response
          .status(403)
          .json({ error: { code: 'FORBIDDEN', message: 'Acceso denegado' } });
      response.json(
        await listRedeemables(
          prisma,
          storage,
          actor,
          parseQuery(redeemableQuerySchema, request.query),
        ),
      );
    } catch (error) {
      next(error);
    }
  });
  router.post(
    '/bulk-assign-zone',
    authorize('redeemable-products:manage'),
    validateBody(bulkAssignSchema),
    async (request, response, next) => {
      try {
        response.json(
          await bulkAssignZone(prisma, request.authUser!, request.body, {
            ip: request.ip ?? null,
            userAgent: request.get('user-agent') ?? null,
          }),
        );
      } catch (error) {
        next(error);
      }
    },
  );
  router.post(
    '/',
    authorize('redeemable-products:manage'),
    validateBody(createRedeemableSchema),
    async (request, response, next) => {
      try {
        response.status(201).json(
          await createRedeemable(prisma, request.authUser!, request.body, {
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
    authorize('redeemable-products:manage'),
    validateBody(updateRedeemableSchema),
    async (request, response, next) => {
      try {
        response.json(
          await updateRedeemable(
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
  return router;
}
