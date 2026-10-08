import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { healthSchema } from '@club/contracts';
import type { Config } from './shared/config';
import type { Storage } from './shared/storage';
import { createAuthRouter } from './modules/auth';
import { createUploadsRouter } from './modules/uploads';
import { createStoresRouter } from './modules/stores';
import {
  createCustomersRouter,
  createPublicCustomersRouter,
} from './modules/customers';
import type { Mailer } from './shared/mailer';
import { createRedemptionsRouter } from './modules/redemptions';
import { createRedeemableRouter } from './modules/redeemable-products';
import { createDiceRouter } from './modules/dice';
import { createProductsRouter } from './modules/products';
import { createZonesRouter } from './modules/zones';
import { createSettingsRouter } from './modules/settings';
import { createDashboardRouter } from './modules/dashboard';
import { createUsersRouter } from './modules/users';
import { createAuditRouter } from './modules/audit';

/** Compone las rutas de infraestructura y los módulos de 1B. */
export function createRoutes(
  prisma: PrismaClient,
  config: Config,
  storage: Storage,
  mailer: Mailer,
): Router {
  const router = Router();
  router.get('/health', async (_request, response, next) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      response.json(healthSchema.parse({ status: 'ok' }));
    } catch (error) {
      next(error);
    }
  });
  router.use('/auth', createAuthRouter(prisma, config));
  router.use('/uploads', createUploadsRouter(prisma, config, storage));
  router.use('/public/stores', createStoresRouter(prisma));
  router.use('/public', createPublicCustomersRouter(prisma, mailer, config));
  router.use('/customers', createCustomersRouter(prisma, config));
  router.use('/redemptions', createRedemptionsRouter(prisma, config));
  router.use(
    '/redeemable-products',
    createRedeemableRouter(prisma, config, storage),
  );
  router.use('/dice', createDiceRouter(prisma, config, storage));
  router.use('/products', createProductsRouter(prisma, config, storage));
  router.use('/zones', createZonesRouter(prisma, config));
  router.use('/settings', createSettingsRouter(prisma, config));
  router.use('/dashboard', createDashboardRouter(prisma, config));
  router.use('/users', createUsersRouter(prisma, config));
  router.use('/audit-logs', createAuditRouter(prisma, config));
  return router;
}
