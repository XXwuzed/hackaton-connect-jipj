import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../../shared/config';
import { authenticate } from '../../shared/middlewares/authenticate';
import { authorize } from '../../shared/middlewares/authorize';
import { validateBody } from '../../shared/middlewares/validate';
import { idSchema, parseQuery } from '../../shared/queries';
import {
  createUserSchema,
  updateUserSchema,
  profileSchema,
  userQuerySchema,
} from './users.dto';
import {
  createUser,
  listUsers,
  resetPassword,
  updateProfile,
  updateUser,
} from './users.service';

function context(request: {
  ip?: string;
  get(name: string): string | undefined;
}) {
  return {
    ip: request.ip ?? null,
    userAgent: request.get('user-agent') ?? null,
  };
}

export function createUsersRouter(
  prisma: PrismaClient,
  config: Config,
): Router {
  const router = Router();
  router.use(authenticate(prisma, config));
  router.patch(
    '/me',
    authorize('profile:update'),
    validateBody(profileSchema),
    async (request, response, next) => {
      try {
        response.json(
          await updateProfile(
            prisma,
            request.authUser!,
            request.body,
            context(request),
          ),
        );
      } catch (error) {
        next(error);
      }
    },
  );
  router.get(
    '/',
    authorize('users:manage'),
    async (request, response, next) => {
      try {
        response.json(
          await listUsers(prisma, parseQuery(userQuerySchema, request.query)),
        );
      } catch (error) {
        next(error);
      }
    },
  );
  router.post(
    '/',
    authorize('users:manage'),
    validateBody(createUserSchema),
    async (request, response, next) => {
      try {
        response
          .status(201)
          .json(
            await createUser(
              prisma,
              request.authUser!,
              request.body,
              context(request),
            ),
          );
      } catch (error) {
        next(error);
      }
    },
  );
  router.patch(
    '/:id',
    authorize('users:manage'),
    validateBody(updateUserSchema),
    async (request, response, next) => {
      try {
        response.json(
          await updateUser(
            prisma,
            request.authUser!,
            parseQuery(idSchema, request.params.id),
            request.body,
            context(request),
          ),
        );
      } catch (error) {
        next(error);
      }
    },
  );
  router.post(
    '/:id/reset-password',
    authorize('users:manage'),
    async (request, response, next) => {
      try {
        response.json(
          await resetPassword(
            prisma,
            request.authUser!,
            parseQuery(idSchema, request.params.id),
            context(request),
          ),
        );
      } catch (error) {
        next(error);
      }
    },
  );
  return router;
}
