import { z } from 'zod';
export const loyaltySchema = z
  .object({ pointsPerDollar: z.number().int().positive().max(100000) })
  .strict();
