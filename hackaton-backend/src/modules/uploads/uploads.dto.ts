import { z } from 'zod';

export const presignSchema = z
  .object({
    contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  })
  .strict();
