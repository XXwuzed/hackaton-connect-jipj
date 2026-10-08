import { z } from 'zod';
import { pageSizes } from './pagination';

export const pageSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine((value) => pageSizes.includes(value as (typeof pageSizes)[number]))
    .default(20),
});

/** Da metadatos homogéneos para listas paginadas. */
export function pageMeta(total: number, page: number, pageSize: number) {
  return {
    total,
    page,
    page_size: pageSize,
    has_next: page * pageSize < total,
    next_cursor: null,
  };
}
