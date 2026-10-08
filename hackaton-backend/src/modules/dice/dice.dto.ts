import { z } from 'zod';
import { pageSchema } from '../../shared/page';
import { dateSchema, idSchema } from '../../shared/queries';

export const diceQuerySchema = pageSchema.extend({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  customerId: idSchema.optional(),
  companyId: idSchema.optional(),
  q: z.string().trim().max(100).optional(),
});
export const prizeQuerySchema = pageSchema.extend({
  q: z.string().trim().max(100).optional(),
  companyId: idSchema.optional(),
  active: z.enum(['true', 'false']).optional(),
});
export const createPrizeSchema = z
  .object({
    productId: idSchema,
    zoneIds: z.array(idSchema).min(1),
    active: z.boolean().default(true),
  })
  .strict();
export const updatePrizeSchema = z
  .object({
    zoneIds: z.array(idSchema).min(1).optional(),
    active: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);
export const createRollSchema = z
  .object({
    customerId: idSchema,
    purchasedItems: z
      .array(
        z
          .object({
            productId: idSchema,
            quantity: z.number().int().positive(),
          })
          .strict(),
      )
      .min(1),
    purchaseAmount: z.number().finite().gt(10),
    die1: z.number().int().min(1).max(6),
    die2: z.number().int().min(1).max(6),
    prizeProductId: idSchema.optional(),
  })
  .strict();
export type CreateRollInput = z.infer<typeof createRollSchema>;
export type CreatePrizeInput = z.infer<typeof createPrizeSchema>;
export type UpdatePrizeInput = z.infer<typeof updatePrizeSchema>;
