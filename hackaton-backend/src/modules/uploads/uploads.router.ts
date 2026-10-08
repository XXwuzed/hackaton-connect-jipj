import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../../shared/config';
import type { Storage } from '../../shared/storage';
import { authenticate } from '../../shared/middlewares/authenticate';
import { authorize } from '../../shared/middlewares/authorize';
import { validateBody } from '../../shared/middlewares/validate';
import { presignSchema } from './uploads.dto';
import { presignUpload } from './uploads.service';

/** Expone solo la URL de subida autorizada para catálogo. */
export function createUploadsRouter(
  prisma: PrismaClient,
  config: Config,
  storage: Storage,
): Router {
  const router = Router();
  router.post(
    '/presign',
    authenticate(prisma, config),
    authorize('catalog:update'),
    validateBody(presignSchema),
    async (request, response, next) => {
      try {
        response.json(await presignUpload(storage, request.body.contentType));
      } catch (error) {
        next(error);
      }
    },
  );
  return router;
}
