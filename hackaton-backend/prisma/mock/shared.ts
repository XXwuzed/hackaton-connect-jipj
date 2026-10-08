import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';

/** Prefiere datos del usuario y recurre a un fixture sintético. */
export function loadRows<T extends z.ZodTypeAny>(
  name: string,
  key: string,
  schema: T,
  csvRow: (row: Record<string, string>) => unknown,
): { rows: z.infer<T>[]; source: string } {
  const suppliedJson = fileURLToPath(
    new URL(`./data/${name}.json`, import.meta.url),
  );
  const suppliedCsv = fileURLToPath(
    new URL(`./data/${name}.csv`, import.meta.url),
  );
  const fixture = fileURLToPath(
    new URL(`./fixtures/${name}.json`, import.meta.url),
  );
  const source = existsSync(suppliedJson)
    ? suppliedJson
    : existsSync(suppliedCsv)
      ? suppliedCsv
      : fixture;
  const raw = readFileSync(source, 'utf8');
  const value: unknown = source.endsWith('.csv')
    ? parse(raw, { columns: true, skip_empty_lines: true, trim: true }).map(
        csvRow,
      )
    : JSON.parse(raw);
  const rows = Array.isArray(value)
    ? value
    : typeof value === 'object' && value !== null && key in value
      ? (value as Record<string, unknown>)[key]
      : undefined;
  if (!Array.isArray(rows))
    throw new Error(`${source}: se esperaba una lista '${key}'`);
  const result: z.infer<T>[] = [];
  const failures: string[] = [];
  for (const [index, row] of rows.entries()) {
    const parsed = schema.safeParse(row);
    if (parsed.success) result.push(parsed.data);
    else
      failures.push(
        `Fila ${index + 1}: ${parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
      );
  }
  if (failures.length) throw new Error(`${source}:\n${failures.join('\n')}`);
  return { rows: result, source };
}

export function csvList(value: string | undefined): string[] {
  return (value ?? '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}
