import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { loadRows } from './shared';

const rowSchema = z.object({
  sku: z.string().min(1),
  unitsSold: z.number().int().nonnegative(),
  margin: z.number().min(-100).max(100),
});
async function main() {
  if (process.env.NODE_ENV === 'production')
    throw new Error('No cargar mock en producción');
  const { rows, source } = loadRows('sales', 'sales', rowSchema, (row) => ({
    sku: row.sku,
    unitsSold: Number(row.unitsSold),
    margin: Number(row.margin),
  }));
  const prisma = new PrismaClient();
  try {
    for (const [index, input] of rows.entries()) {
      const product = await prisma.product.findUnique({
        where: { sku: input.sku },
      });
      if (!product)
        throw new Error(`Fila ${index + 1}: SKU ${input.sku} no existe`);
      await prisma.productSalesSummary.upsert({
        where: { productId: product.id },
        create: {
          productId: product.id,
          unitsSold: input.unitsSold,
          margin: input.margin,
        },
        update: { unitsSold: input.unitsSold, margin: input.margin },
      });
    }
    process.stdout.write(
      `${source}: ${rows.length} resúmenes de ventas cargados.\n`,
    );
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
