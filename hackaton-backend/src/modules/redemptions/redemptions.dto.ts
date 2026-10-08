import { z } from 'zod';
import { pageSchema } from '../../shared/page';
import { dateSchema, idSchema } from '../../shared/queries';

export const createRedemptionSchema = z
  .object({ customerId: idSchema, productIds: z.array(idSchema).min(1).max(2) })
  .strict();
export const redemptionQuerySchema = pageSchema.extend({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  customerId: idSchema.optional(),
  companyId: idSchema.optional(),
  q: z.string().trim().max(100).optional(),
});
export type CreateRedemptionInput = z.infer<typeof createRedemptionSchema>;
export type RedemptionQuery = z.infer<typeof redemptionQuerySchema>;
