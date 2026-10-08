import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { assertSeedAllowed, csvList, loadRows } from './shared';

const rowSchema = z.object({
  sku: z.string().min(1),
  pointsRequired: z.number().int().positive(),
  discountPercent: z.number().min(0).max(100).nullable(),
  zoneNames: z.array(z.string().min(1)).min(1),
});

async function main() {
  assertSeedAllowed();
  const { rows, source } = loadRows(
    'redeemables',
    'redeemables',
    rowSchema,
    (row) => ({
      sku: row.sku,
      pointsRequired: Number(row.pointsRequired),
      discountPercent: row.discountPercent ? Number(row.discountPercent) : null,
      zoneNames: csvList(row.zoneNames),
    }),
  );
  const prisma = new PrismaClient();
  try {
    for (const [index, input] of rows.entries()) {
      const product = await prisma.product.findUnique({
        where: { sku: input.sku },
      });
      if (!product)
        throw new Error(`Fila ${index + 1}: SKU ${input.sku} no existe`);
      const zones = await prisma.zone.findMany({
        where: { name: { in: input.zoneNames }, active: true, deletedAt: null },
      });
      if (zones.length !== new Set(input.zoneNames).size)
        throw new Error(
          `Fila ${index + 1}: alguna zona no existe o no está activa`,
        );
      await prisma.redeemableProduct.upsert({
        where: { productId: product.id },
        create: {
          productId: product.id,
          pointsRequired: input.pointsRequired,
          discountPercent: input.discountPercent,
          zones: { create: zones.map((zone) => ({ zoneId: zone.id })) },
        },
        update: {
          pointsRequired: input.pointsRequired,
          discountPercent: input.discountPercent,
          active: true,
          zones: {
            deleteMany: {},
            create: zones.map((zone) => ({ zoneId: zone.id })),
          },
        },
      });
    }
    process.stdout.write(`${source}: ${rows.length} canjeables cargados.\n`);
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
