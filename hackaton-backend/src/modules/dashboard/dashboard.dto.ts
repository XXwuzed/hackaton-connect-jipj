import { z } from 'zod';
import { pageSchema } from '../../shared/page';
import { idSchema } from '../../shared/queries';
export const summaryQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
});
export const rotationQuerySchema = pageSchema.extend({
  q: z.string().trim().max(100).optional(),
  companyId: idSchema.optional(),
  order: z
    .enum(['units_asc', 'units_desc', 'margin_asc', 'margin_desc'])
    .default('units_asc'),
});
