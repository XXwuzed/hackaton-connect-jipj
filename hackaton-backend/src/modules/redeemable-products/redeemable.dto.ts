import { z } from 'zod';
import { pageSchema } from '../../shared/page';
import { idSchema } from '../../shared/queries';

export const redeemableQuerySchema = pageSchema.extend({
  q: z.string().trim().max(100).optional(),
  companyId: idSchema.optional(),
  active: z.enum(['true', 'false']).optional(),
});
export const createRedeemableSchema = z
  .object({
    productId: idSchema,
    pointsRequired: z.number().int().positive(),
    discountPercent: z.number().min(0).max(100).nullable().optional(),
    zoneIds: z.array(idSchema).min(1),
  })
  .strict();
export const updateRedeemableSchema = z
  .object({
    pointsRequired: z.number().int().positive().optional(),
    discountPercent: z.number().min(0).max(100).nullable().optional(),
    zoneIds: z.array(idSchema).min(1).optional(),
    active: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);
export const bulkAssignSchema = z
  .object({
    zoneId: idSchema,
    redeemableProductIds: z.array(idSchema).min(1).max(100),
  })
  .strict();
export type CreateRedeemableInput = z.infer<typeof createRedeemableSchema>;
export type UpdateRedeemableInput = z.infer<typeof updateRedeemableSchema>;
export type BulkAssignInput = z.infer<typeof bulkAssignSchema>;
