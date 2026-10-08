import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../../shared/config';
import { authenticate } from '../../shared/middlewares/authenticate';
import { loginRateLimit } from '../../shared/middlewares/rate-limit';
import { validateBody } from '../../shared/middlewares/validate';
import { changePasswordSchema, loginSchema } from './auth.dto';
import {
  changePasswordController,
  loginController,
  logoutController,
  meController,
  refreshController,
} from './auth.controller';

/** Agrupa exclusivamente las rutas de autenticación. */
export function createAuthRouter(prisma: PrismaClient, config: Config): Router {
  const router = Router();
  router.post(
    '/login',
    loginRateLimit,
    validateBody(loginSchema),
    (request, response, next) =>
      void loginController(request, response, next, prisma, config),
  );
  router.post('/logout', (_request, response) =>
    logoutController(response, config),
  );
  router.post(
    '/refresh',
    (request, response, next) =>
      void refreshController(request, response, next, prisma, config),
  );
  router.get('/me', authenticate(prisma, config, true), meController);
  router.post(
    '/change-password',
    authenticate(prisma, config, true),
    validateBody(changePasswordSchema),
    (request, response, next) =>
      void changePasswordController(request, response, next, prisma),
  );
  return router;
}
