import { z } from 'zod';
import { nationalIdSchema } from '@club/contracts';
import { pageSchema } from '../../shared/page';

export const registerSchema = z
  .object({
    nationalId: nationalIdSchema,
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z
      .string()
      .trim()
      .email()
      .transform((value) => value.toLowerCase()),
    phone: z.string().trim().min(7).max(20).optional(),
    consent: z.literal(true),
    storeCode: z.string().trim().min(1),
    recaptchaToken: z.string(),
  })
  .strict();

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const customersQuerySchema = pageSchema.extend({
  q: z.string().trim().max(100).optional(),
  from: date.optional(),
  to: date.optional(),
  order: z.enum(['created_desc', 'points_desc']).default('created_desc'),
  scope: z.enum(['zone', 'all']).default('zone'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type CustomersQuery = z.infer<typeof customersQuerySchema>;
