import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { assertSeedAllowed } from './mock/shared';

const SEED_PASSWORD_MIN_LENGTH = 8; // Contraseñas demo del hackatón (ej. Admin123!)

const baseSchema = z.object({
  synthetic: z.literal(true),
  company: z.object({ name: z.string().min(1) }),
  zones: z
    .array(
      z.object({
        name: z.string().min(1),
        centerLat: z.number().min(-90).max(90),
        centerLng: z.number().min(-180).max(180),
        radiusMeters: z.number().int().positive(),
      }),
    )
    .min(1),
  stores: z
    .array(
      z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        zoneName: z.string().min(1),
      }),
    )
    .min(1),
  users: z.object({
    admin: z.object({
      email: z.string().email(),
      firstName: z.string(),
      lastName: z.string(),
    }),
    advisor: z.object({
      email: z.string().email(),
      firstName: z.string(),
      lastName: z.string(),
      storeCode: z.string().min(1),
    }),
  }),
  products: z
    .array(
      z.object({
        sku: z.string().min(1),
        name: z.string().min(1),
        description: z.string(),
        pvp: z.string().regex(/^\d+\.\d{2}$/),
      }),
    )
    .min(1),
});

function loadBaseData() {
  const supplied = fileURLToPath(
    new URL('./mock/data/base.json', import.meta.url),
  );
  const fixture = fileURLToPath(
    new URL('./mock/fixtures/base.json', import.meta.url),
  );
  const path = existsSync(supplied) ? supplied : fixture;
  const parsed = baseSchema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
  if (!parsed.success) {
    throw new Error(`Seed inválido en ${path}: ${parsed.error.message}`);
  }
  return parsed.data;
}

/** Carga datos de demostración idempotentes; en producción requiere opt-in. */
async function main(): Promise<void> {
  assertSeedAllowed();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const advisorPassword = process.env.SEED_ADVISOR_PASSWORD;
  if (
    !adminPassword ||
    adminPassword.length < SEED_PASSWORD_MIN_LENGTH ||
    !advisorPassword ||
    advisorPassword.length < SEED_PASSWORD_MIN_LENGTH
  ) {
    throw new Error(
      `Configura SEED_ADMIN_PASSWORD y SEED_ADVISOR_PASSWORD (mínimo ${SEED_PASSWORD_MIN_LENGTH} caracteres)`,
    );
  }
  const data = loadBaseData();
  const prisma = new PrismaClient();
  try {
    const company = await prisma.company.upsert({
      where: { name: data.company.name },
      create: data.company,
      update: { active: true },
    });
    const zoneIds = new Map<string, string>();
    for (const zoneData of data.zones) {
      const zone = await prisma.zone.upsert({
        where: { name: zoneData.name },
        create: zoneData,
        update: { active: true, deletedAt: null },
      });
      zoneIds.set(zone.name, zone.id);
    }
    const stores = new Map<string, { id: string; zoneId: string }>();
    for (const { zoneName, ...storeData } of data.stores) {
      const zoneId = zoneIds.get(zoneName);
      if (!zoneId)
        throw new Error(
          `Tienda ${storeData.code}: zona ${zoneName} no definida`,
        );
      const store = await prisma.store.upsert({
        where: { code: storeData.code },
        create: { ...storeData, companyId: company.id, zoneId },
        update: {
          name: storeData.name,
          active: true,
          companyId: company.id,
          zoneId,
        },
      });
      stores.set(store.code, { id: store.id, zoneId });
    }
    const admin = data.users.admin;
    const { storeCode: advisorStoreCode, ...advisor } = data.users.advisor;
    const advisorStore = stores.get(advisorStoreCode);
    if (!advisorStore)
      throw new Error(`Asesor: tienda ${advisorStoreCode} no definida`);
    await prisma.user.upsert({
      where: { email: admin.email },
      create: {
        ...admin,
        role: 'ADMIN',
        passwordHash: await argon2.hash(adminPassword, {
          type: argon2.argon2id,
        }),
        mustChangePassword: false,
      },
      update: {
        firstName: admin.firstName,
        lastName: admin.lastName,
        passwordHash: await argon2.hash(adminPassword, {
          type: argon2.argon2id,
        }),
        active: true,
      },
    });
    await prisma.user.upsert({
      where: { email: advisor.email },
      create: {
        ...advisor,
        role: 'ADVISOR',
        companyId: company.id,
        zoneId: advisorStore.zoneId,
        storeId: advisorStore.id,
        passwordHash: await argon2.hash(advisorPassword, {
          type: argon2.argon2id,
        }),
        mustChangePassword: false,
      },
      update: {
        firstName: advisor.firstName,
        lastName: advisor.lastName,
        passwordHash: await argon2.hash(advisorPassword, {
          type: argon2.argon2id,
        }),
        active: true,
        companyId: company.id,
        zoneId: advisorStore.zoneId,
        storeId: advisorStore.id,
      },
    });
    await prisma.loyaltySettings.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {},
    });
    for (const product of data.products) {
      await prisma.product.upsert({
        where: { sku: product.sku },
        create: { ...product, companyId: company.id },
        update: {
          name: product.name,
          description: product.description,
          pvp: product.pvp,
        },
      });
    }
    process.stdout.write(
      `Seed sintético: ${data.zones.length} zonas, ${data.stores.length} tiendas, ${data.products.length} productos, 2 usuarios.\n`,
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
