import { z } from 'zod';
import { pageSchema } from '../../shared/page';
import { dateSchema, idSchema } from '../../shared/queries';
export const auditQuerySchema = pageSchema.extend({
  userId: idSchema.optional(),
  action: z.string().trim().max(100).optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  entityType: z.string().trim().max(100).optional(),
});
