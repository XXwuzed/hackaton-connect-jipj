import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../../shared/config';
import type { Mailer } from '../../shared/mailer';
import { UnauthorizedError, ValidationError } from '../../shared/errors';
import { authenticate } from '../../shared/middlewares/authenticate';
import { authorize } from '../../shared/middlewares/authorize';
import { registrationRateLimit } from '../../shared/middlewares/rate-limit';
import { validateBody } from '../../shared/middlewares/validate';
import { registerSchema, customersQuerySchema } from './customers.dto';
import { registerCustomer } from './services/register.service';
import {
  getUnsubscribeInfo,
  unsubscribeCustomer,
} from './services/unsubscribe.service';
import { listCustomers } from './services/list.service';
import { getCustomer } from './services/detail.service';

/** Define inscripción y baja públicas, sin credenciales internas. */
export function createPublicCustomersRouter(
  prisma: PrismaClient,
  mailer: Mailer,
  config: Config,
): Router {
  const router = Router();
  router.post(
    '/customers',
    registrationRateLimit,
    validateBody(registerSchema),
    async (request, response, next) => {
      try {
        const result = await registerCustomer(
          prisma,
          mailer,
          config,
          request.body,
          {
            ip: request.ip ?? null,
            userAgent: request.get('user-agent') ?? null,
          },
        );
        response.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },
  );
  router.get('/unsubscribe/:token', async (request, response, next) => {
    try {
      response.json(await getUnsubscribeInfo(prisma, request.params.token));
    } catch (error) {
      next(error);
    }
  });
  router.post('/unsubscribe/:token', async (request, response, next) => {
    try {
      response.json(
        await unsubscribeCustomer(prisma, request.params.token, {
          ip: request.ip ?? null,
          userAgent: request.get('user-agent') ?? null,
        }),
      );
    } catch (error) {
      next(error);
    }
  });
  return router;
}

/** Define lectura interna de clientes para admin y asesor. */
export function createCustomersRouter(
  prisma: PrismaClient,
  config: Config,
): Router {
  const router = Router();
  router.use(authenticate(prisma, config), authorize('customers:read'));
  router.get('/', async (request, response, next) => {
    try {
      if (!request.authUser) throw new UnauthorizedError();
      const parsed = customersQuerySchema.safeParse(request.query);
      if (!parsed.success) throw new ValidationError();
      response.json(await listCustomers(prisma, request.authUser, parsed.data));
    } catch (error) {
      next(error);
    }
  });
  router.get('/:id', async (request, response, next) => {
    try {
      response.json(await getCustomer(prisma, request.params.id));
    } catch (error) {
      next(error);
    }
  });
  return router;
}
