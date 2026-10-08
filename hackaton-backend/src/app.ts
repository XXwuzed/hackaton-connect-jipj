import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type { Mailer } from './shared/mailer';
import type { Storage } from './shared/storage';
import type { PrismaClient } from '@prisma/client';
import { loadConfig, type Config } from './shared/config';
import { createRoutes } from './routes';
import { httpRateLimit } from './shared/middlewares/rate-limit';
import { errorHandler } from './shared/middlewares/error-handler';
import { NotFoundError } from './shared/errors';
import { db } from './shared/db';
import { requireRequestedWith } from './shared/middlewares/requested-with';

interface AppDependencies {
  storage: Storage;
  mailer: Mailer;
  prisma?: PrismaClient;
}

/** Crea una API con dependencias reemplazables en pruebas. */
export function createApp(
  deps: AppDependencies,
  config: Config = loadConfig(),
): express.Express {
  const app = express();
  app.locals.storage = deps.storage;
  app.locals.mailer = deps.mailer;
  app.disable('x-powered-by');
  app.set('trust proxy', config.NODE_ENV === 'production' ? 1 : false);
  app.use(helmet());
  app.use(
    cors({
      origin: config.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(httpRateLimit);
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(
    '/api',
    requireRequestedWith,
    createRoutes(deps.prisma ?? db, config, deps.storage, deps.mailer),
  );
  app.use((_request, _response, next) => next(new NotFoundError()));
  app.use(errorHandler);
  return app;
}
