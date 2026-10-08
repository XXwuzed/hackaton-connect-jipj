import { Router } from 'express';
import { Prisma, type PrismaClient } from '@prisma/client';
import type { Config } from '../../shared/config';
import { authenticate } from '../../shared/middlewares/authenticate';
import { authorize } from '../../shared/middlewares/authorize';
import { parseQuery, localStart, nextLocalDay } from '../../shared/queries';
import { pageMeta } from '../../shared/page';
import { auditQuerySchema } from './audit.dto';

/** Auditoría de solo lectura; nunca expone mutaciones. */
export function createAuditRouter(
  prisma: PrismaClient,
  config: Config,
): Router {
  const router = Router();
  router.use(authenticate(prisma, config), authorize('audit:read'));
  router.get('/', async (request, response, next) => {
    try {
      const query = parseQuery(auditQuerySchema, request.query);
      const where: Prisma.AuditLogWhereInput = {
        ...(query.userId ? { actorId: query.userId } : {}),
        ...(query.action ? { action: { contains: query.action } } : {}),
        ...(query.entityType ? { entityType: query.entityType } : {}),
        ...(query.from || query.to
          ? {
              createdAt: {
                ...(query.from ? { gte: localStart(query.from) } : {}),
                ...(query.to ? { lt: nextLocalDay(query.to) } : {}),
              },
            }
          : {}),
      };
      const [total, data] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
      ]);
      response.json({
        data,
        meta: pageMeta(total, query.page, query.pageSize),
      });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
