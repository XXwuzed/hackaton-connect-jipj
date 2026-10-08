import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../../shared/config';
import type { Storage } from '../../shared/storage';
import { authenticate } from '../../shared/middlewares/authenticate';
import { authorize } from '../../shared/middlewares/authorize';
import { validateBody } from '../../shared/middlewares/validate';
import { idSchema, parseQuery } from '../../shared/queries';
import { hasPermission } from '../../shared/authz/permissions';
import { ForbiddenError } from '../../shared/errors';
import { productQuerySchema, updateProductSchema } from './products.dto';
import { getProduct, listProducts, updateProduct } from './products.service';

export function createProductsRouter(
  prisma: PrismaClient,
  config: Config,
  storage: Storage,
): Router {
  const router = Router();
  router.use(authenticate(prisma, config));
  router.get('/', async (request, response, next) => {
    try {
      const actor = request.authUser!;
      if (
        !hasPermission(actor.role, 'catalog:read') &&
        !hasPermission(actor.role, 'dice:create')
      )
        throw new ForbiddenError();
      response.json(
        await listProducts(
          prisma,
          storage,
          actor,
          parseQuery(productQuerySchema, request.query),
        ),
      );
    } catch (error) {
      next(error);
    }
  });
  router.get(
    '/:id',
    authorize('catalog:read'),
    async (request, response, next) => {
      try {
        response.json(
          await getProduct(
            prisma,
            storage,
            parseQuery(idSchema, request.params.id),
          ),
        );
      } catch (error) {
        next(error);
      }
    },
  );
  router.patch(
    '/:id',
    authorize('catalog:update'),
    validateBody(updateProductSchema),
    async (request, response, next) => {
      try {
        response.json(
          await updateProduct(
            prisma,
            storage,
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
