import { z } from 'zod';
import { pageSchema } from '../../shared/page';

const userFields = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  role: z.enum(['ADMIN', 'ADVISOR']),
  companyId: z.string().uuid().nullable(),
  zoneId: z.string().uuid().nullable(),
  storeId: z.string().uuid().nullable(),
});
export const createUserSchema = userFields
  .strict()
  .refine(
    (value) =>
      value.role === 'ADMIN'
        ? !value.companyId && !value.zoneId && !value.storeId
        : Boolean(value.companyId && value.zoneId && value.storeId),
    'Rol y ámbito incompatibles',
  );
export const updateUserSchema = userFields
  .partial()
  .extend({ active: z.boolean().optional() })
  .strict()
  .refine((value) => Object.keys(value).length > 0);
export const profileSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
  })
  .strict();
export const userQuerySchema = pageSchema.extend({
  q: z.string().trim().max(100).optional(),
  role: z.enum(['ADMIN', 'ADVISOR']).optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
