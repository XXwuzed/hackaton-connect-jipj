import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { nationalIdSchema } from '@club/contracts';
import { addOneYearEndOfDay } from '../../src/shared/time';
import { assertSeedAllowed, loadRows } from './shared';

const lotSchema = z
  .object({
    points: z.number().int().positive(),
    earnedDaysAgo: z.number().int().nonnegative().optional(),
    earnedAt: z.string().datetime().optional(),
  })
  .refine(
    (value) => Boolean(value.earnedAt) !== (value.earnedDaysAgo !== undefined),
    'Cada lote requiere earnedAt o earnedDaysAgo',
  );
const customerSchema = z.object({
  nationalId: nationalIdSchema,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  storeCode: z.string().min(1),
  status: z.enum(['ACTIVE', 'UNSUBSCRIBED']).default('ACTIVE'),
  lots: z.array(lotSchema),
});

function lotId(nationalId: string, index: number): string {
  const hex = createHash('sha256')
    .update(`${nationalId}:${index}`)
    .digest('hex')
    .slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Carga clientes y lotes de prueba sin duplicarlos al repetir la orden. */
async function main() {
  assertSeedAllowed();
  const { rows, source } = loadRows(
    'customers',
    'customers',
    customerSchema,
    (row) => ({
      nationalId: row.nationalId,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      storeCode: row.storeCode,
      status: row.status || 'ACTIVE',
      lots: [
        {
          points: Number(row.points),
          ...(row.earnedAt
            ? { earnedAt: row.earnedAt }
            : row.earnedDaysAgo
              ? { earnedDaysAgo: Number(row.earnedDaysAgo) }
              : {}),
        },
      ],
    }),
  );
  const grouped = new Map<string, z.infer<typeof customerSchema>>();
  for (const row of rows) {
    const existing = grouped.get(row.nationalId);
    if (existing) {
      if (
        existing.email !== row.email ||
        existing.storeCode !== row.storeCode ||
        existing.status !== row.status
      )
        throw new Error(
          `${source}: datos inconsistentes para cédula ${row.nationalId}`,
        );
      existing.lots.push(...row.lots);
    } else grouped.set(row.nationalId, { ...row, lots: [...row.lots] });
  }
  const prisma = new PrismaClient();
  try {
    for (const [row, input] of [...grouped.values()].entries()) {
      const store = await prisma.store.findUnique({
        where: { code: input.storeCode },
        select: { id: true, zoneId: true },
      });
      if (!store)
        throw new Error(
          `Fila ${row + 1}: tienda ${input.storeCode} no existe; ejecuta db:seed`,
        );
      const customer = await prisma.customer.upsert({
        where: { nationalId: input.nationalId },
        create: {
          nationalId: input.nationalId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          status: input.status,
          unsubscribedAt: input.status === 'UNSUBSCRIBED' ? new Date() : null,
          registeredStoreId: store.id,
          zoneId: store.zoneId,
          consentAt: new Date(),
          consentVersion: 'synthetic-fixture-v1',
        },
        update: {},
      });
      for (const [index, lot] of input.lots.entries()) {
        const earnedAt = lot.earnedAt
          ? new Date(lot.earnedAt)
          : new Date(Date.now() - (lot.earnedDaysAgo ?? 0) * 86_400_000);
        await prisma.pointsLot.upsert({
          where: { id: lotId(input.nationalId, index) },
          create: {
            id: lotId(input.nationalId, index),
            customerId: customer.id,
            pointsEarned: lot.points,
            pointsRemaining: lot.points,
            earnedAt,
            expiresAt: addOneYearEndOfDay(earnedAt),
          },
          update: {},
        });
      }
    }
    process.stdout.write(`${source}: ${grouped.size} clientes.\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : 'Error desconocido'}\n`,
  );
  process.exitCode = 1;
});
