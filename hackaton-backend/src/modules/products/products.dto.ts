import { z } from 'zod';
import { pageSchema } from '../../shared/page';
import { idSchema } from '../../shared/queries';

export const productQuerySchema = pageSchema.extend({
  q: z.string().trim().max(100).optional(),
  companyId: idSchema.optional(),
});
export const updateProductSchema = z
  .object({
    imageKey: z.string().startsWith('products/').max(255).nullable().optional(),
    description: z.string().trim().max(2000).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
