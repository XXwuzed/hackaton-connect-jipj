import { z } from 'zod';
import { pageSchema } from '../../shared/page';

export const zoneQuerySchema = pageSchema.extend({
  q: z.string().trim().max(100).optional(),
  active: z.enum(['true', 'false']).optional(),
});
export const createZoneSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    centerLat: z.number().min(-90).max(90),
    centerLng: z.number().min(-180).max(180),
    radiusMeters: z.number().int().positive(),
  })
  .strict();
export const updateZoneSchema = createZoneSchema
  .partial()
  .extend({ active: z.boolean().optional() })
  .strict()
  .refine((value) => Object.keys(value).length > 0);
export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
