import { z } from 'zod';

export const identifierSchema = z.string().min(1);
export const paginationSchema = z.object({
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});
export const errorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
export const healthSchema = z.object({ status: z.literal('ok') });
