import { z } from 'zod';
import { ValidationError } from './errors';

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
      new Date(`${value}T00:00:00Z`).toISOString().startsWith(value),
  );
export const idSchema = z.string().uuid();

export function parseQuery<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown,
): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new ValidationError(
      result.error.issues.map((issue) => issue.message).join('; '),
    );
  return result.data;
}

export function localStart(value: string): Date {
  return new Date(`${value}T05:00:00.000Z`);
}
export function nextLocalDay(value: string): Date {
  return new Date(localStart(value).getTime() + 86_400_000);
}
