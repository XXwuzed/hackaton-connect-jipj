import { randomInt, randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { db } from '../../src/shared/db';
import { signToken } from '../../src/modules/auth/auth.tokens';
import { getBalance } from '../../src/modules/points';
import { testConfig } from '../helpers/config';

const marker = randomUUID();
const app = createApp(
  {
    prisma: db,
    storage: {
      getUploadUrl: async () => 'https://example.com/upload',
      getReadUrl: async () => 'https://example.com/read',
    },
    mailer: {
      send: async () => {
        throw new Error('synthetic mail failure');
      },
    },
  },
  testConfig,
);
let adminCookie = '',
  advisorCookie = '',
  otherCookie = '';
let companyId = '',
  zoneId = '',
  storeId = '',
  otherZoneId = '',
  otherCompanyId = '',
  otherStoreId = '';
let productId = '',
  otherProductId = '',
  zoneProductId = '',
  redeemableId = '';
let counter = 0;
const idOffset = randomInt(0, 5_000_000);

function nationalId(): string {
  const body = `24${String(idOffset + ++counter).padStart(7, '0')}`;
  const weights = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const sum = body.split('').reduce((total, char, index) => {
    const value = Number(char) * weights[index]!;
    return total + (value > 9 ? value - 9 : value);
  }, 0);
  return `${body}${(10 - (sum % 10)) % 10}`;
}
async function customer(
  points: number,
  opts: { status?: 'ACTIVE' | 'UNSUBSCRIBED'; zoneId?: string } = {},
) {
  const row = await db.customer.create({
    data: {
      nationalId: nationalId(),
      firstName: 'Synthetic',
      lastName: 'Customer',
      email: `customer-${randomUUID()}@example.com`,
      registeredStoreId: storeId,
      zoneId: opts.zoneId ?? zoneId,
      consentAt: new Date(),
      consentVersion: 'test',
      status: opts.status ?? 'ACTIVE',
    },
  });
  if (points > 0)
    await db.pointsLot.create({
      data: {
        customerId: row.id,
        pointsEarned: points,
        pointsRemaining: points,
        earnedAt: new Date(),
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });
  return row;
}
function post(path: string, cookie = advisorCookie) {
  return request(app)
    .post(`/api${path}`)
    .set('Cookie', cookie)
    .set('X-Requested-With', 'club');
}

describe.skipIf(process.env.RUN_DB_TESTS !== '1')(
  'fases 2–5 con club_test PostgreSQL',
  () => {
    beforeAll(async () => {
      const company = await db.company.create({
        data: { name: `Synthetic Company ${marker}` },
      });
      companyId = company.id;
      const other = await db.company.create({
        data: { name: `Synthetic Other ${marker}` },
      });
      otherCompanyId = other.id;
      const zone = await db.zone.create({
        data: {
          name: `Synthetic Zone ${marker}`,
          centerLat: -0.2,
          centerLng: -78.5,
          radiusMeters: 1000,
        },
      });
      zoneId = zone.id;
      const otherZone = await db.zone.create({
        data: {
          name: `Synthetic Other Zone ${marker}`,
          centerLat: -0.3,
          centerLng: -78.4,
          radiusMeters: 1000,
        },
      });
      otherZoneId = otherZone.id;
      const store = await db.store.create({
        data: {
          code: `TEST-${marker}`,
          name: 'Synthetic Store',
          companyId,
          zoneId,
        },
      });
      storeId = store.id;
      const otherStore = await db.store.create({
        data: {
          code: `OTHER-${marker}`,
          name: 'Synthetic Other Store',
          companyId,
          zoneId,
        },
      });
      otherStoreId = otherStore.id;
      const product = await db.product.create({
        data: {
          sku: `SYN-${marker}`,
          name: 'Synthetic Product',
          pvp: 5,
          companyId,
        },
      });
      productId = product.id;
      const otherProduct = await db.product.create({
        data: {
          sku: `OTHER-${marker}`,
          name: 'Other Product',
          pvp: 5,
          companyId: otherCompanyId,
        },
      });
      otherProductId = otherProduct.id;
      const zoneProduct = await db.product.create({
        data: {
          sku: `ZONE-${marker}`,
          name: 'Other Zone Product',
          pvp: 5,
          companyId,
        },
      });
      zoneProductId = zoneProduct.id;
      await db.redeemableProduct.create({
        data: {
          productId: zoneProductId,
          pointsRequired: 15,
          zones: { create: { zoneId: otherZoneId } },
        },
      });
      const redeemable = await db.redeemableProduct.create({
        data: { productId, pointsRequired: 15, zones: { create: { zoneId } } },
      });
      redeemableId = redeemable.id;
      await db.dicePrize.create({
        data: { productId, zones: { create: { zoneId } } },
      });
      await db.dicePrize.create({
        data: {
          productId: zoneProductId,
          zones: { create: { zoneId: otherZoneId } },
        },
      });
      const passwordHash = await argon2.hash('SyntheticPassword-123');
      const admin = await db.user.create({
        data: {
          email: `admin-${marker}@example.com`,
          firstName: 'Synthetic',
          lastName: 'Admin',
          role: 'ADMIN',
          passwordHash,
          mustChangePassword: false,
        },
      });
      const advisor = await db.user.create({
        data: {
          email: `advisor-${marker}@example.com`,
          firstName: 'Synthetic',
          lastName: 'Advisor',
          role: 'ADVISOR',
          passwordHash,
          mustChangePassword: false,
          companyId,
          zoneId,
          storeId,
        },
      });
      const otherAdvisor = await db.user.create({
        data: {
          email: `advisor2-${marker}@example.com`,
          firstName: 'Other',
          lastName: 'Advisor',
          role: 'ADVISOR',
          passwordHash,
          mustChangePassword: false,
          companyId,
          zoneId,
          storeId: otherStoreId,
        },
      });
      adminCookie = `club_access=${await signToken(admin.id, 'access', testConfig)}`;
      advisorCookie = `club_access=${await signToken(advisor.id, 'access', testConfig)}`;
      otherCookie = `club_access=${await signToken(otherAdvisor.id, 'access', testConfig)}`;
    });

    it('inscribe con zona del QR, audita y tolera fallo de correo; rechaza cédula duplicada incluso baja', async () => {
      const id = nationalId();
      const body = {
        nationalId: id,
        firstName: 'Synthetic',
        lastName: 'Signup',
        email: `signup-${marker}@example.com`,
        consent: true,
        storeCode: `TEST-${marker}`,
        recaptchaToken: 'bypass',
      };
      expect(
        (await post('/public/customers').send({ ...body, nationalId: '123' }))
          .status,
      ).toBe(400);
      expect(
        (
          await post('/public/customers').send({
            ...body,
            nationalId: `${id}001`,
          })
        ).status,
      ).toBe(400);
      const created = await post('/public/customers').send(body);
      expect(created.status).toBe(201);
      const row = await db.customer.findUniqueOrThrow({
        where: { nationalId: id },
      });
      expect(row.zoneId).toBe(zoneId);
      expect(
        await db.auditLog.count({
          where: { action: 'customer.register', entityId: row.id },
        }),
      ).toBe(1);
      expect((await post('/public/customers').send(body)).status).toBe(409);
      const info = await request(app).get(
        `/api/public/unsubscribe/${row.unsubscribeToken}`,
      );
      expect(info.status).toBe(200);
      expect(
        (await db.customer.findUniqueOrThrow({ where: { id: row.id } })).status,
      ).toBe('ACTIVE');
      expect(
        (await post(`/public/unsubscribe/${row.unsubscribeToken}`).send({}))
          .status,
      ).toBe(200);
      expect(
        (await post(`/public/unsubscribe/${row.unsubscribeToken}`).send({}))
          .status,
      ).toBe(200);
      expect(
        await db.auditLog.count({
          where: { action: 'customer.unsubscribe', entityId: row.id },
        }),
      ).toBe(1);
      expect((await post('/public/customers').send(body)).status).toBe(409);
    });

    it('excluye puntos vencidos y filtra clientes del asesor por zona salvo scope=all', async () => {
      const local = await customer(20);
      const remote = await customer(0, { zoneId: otherZoneId });
      await db.pointsLot.create({
        data: {
          customerId: local.id,
          pointsEarned: 50,
          pointsRemaining: 50,
          earnedAt: new Date(Date.now() - 400 * 86_400_000),
          expiresAt: new Date(Date.now() - 86_400_000),
        },
      });
      expect(await getBalance(db, local.id)).toBe(20);
      const own = await request(app)
        .get(`/api/customers?q=${remote.nationalId}`)
        .set('Cookie', advisorCookie);
      expect(own.body.data).toHaveLength(0);
      const all = await request(app)
        .get(`/api/customers?q=${remote.nationalId}&scope=all`)
        .set('Cookie', advisorCookie);
      expect(all.body.data).toHaveLength(1);
    });

    it('consume FIFO, permite saldo exacto y no sobreconsume', async () => {
      const row = await customer(0);
      const early = await db.pointsLot.create({
        data: {
          customerId: row.id,
          pointsEarned: 10,
          pointsRemaining: 10,
          earnedAt: new Date(Date.now() - 20 * 86_400_000),
          expiresAt: new Date(Date.now() + 86_400_000),
        },
      });
      const late = await db.pointsLot.create({
        data: {
          customerId: row.id,
          pointsEarned: 10,
          pointsRemaining: 10,
          earnedAt: new Date(Date.now() - 10 * 86_400_000),
          expiresAt: new Date(Date.now() + 2 * 86_400_000),
        },
      });
      const response = await post('/redemptions').send({
        customerId: row.id,
        productIds: [productId],
      });
      expect(response.status).toBe(201);
      const redemptionId = response.body.data[0].id as string;
      expect(await getBalance(db, row.id)).toBe(5);
      expect(
        (
          await db.pointsLotUsage.aggregate({
            where: { redemptionId },
            _sum: { points: true },
          })
        )._sum.points,
      ).toBe(15);
      expect(
        (await db.pointsLot.findUniqueOrThrow({ where: { id: early.id } }))
          .pointsRemaining,
      ).toBe(0);
      const exact = await customer(15);
      expect(
        (
          await post('/redemptions').send({
            customerId: exact.id,
            productIds: [productId],
          })
        ).status,
      ).toBe(201);
      expect(await getBalance(db, exact.id)).toBe(0);
      expect(
        (await db.pointsLot.findUniqueOrThrow({ where: { id: late.id } }))
          .pointsRemaining,
      ).toBe(5);
      const insufficient = await customer(14);
      expect(
        (
          await post('/redemptions').send({
            customerId: insufficient.id,
            productIds: [productId],
          })
        ).status,
      ).toBe(409);
    });

    it('aplica límite diario global, mes por producto y ABAC', async () => {
      const row = await customer(100);
      expect(
        (
          await post('/redemptions').send({
            customerId: row.id,
            productIds: [productId],
          })
        ).status,
      ).toBe(201);
      expect(
        (
          await post('/redemptions', otherCookie).send({
            customerId: row.id,
            productIds: [productId],
          })
        ).status,
      ).toBe(201);
      const third = await post('/redemptions').send({
        customerId: row.id,
        productIds: [productId],
      });
      expect(third.status).toBe(409);
      expect(third.body.error.code).toBe('DAILY_LIMIT');
      expect(
        (
          await post('/redemptions', adminCookie).send({
            customerId: row.id,
            productIds: [productId],
          })
        ).status,
      ).toBe(403);
      expect(
        (
          await post('/redemptions').send({
            customerId: (await customer(100)).id,
            productIds: [otherProductId],
          })
        ).status,
      ).toBe(409);
      expect(
        (
          await post('/redemptions').send({
            customerId: (await customer(100)).id,
            productIds: [zoneProductId],
          })
        ).status,
      ).toBe(409);
      const monthCustomer = await customer(100);
      for (let i = 0; i < 4; i++)
        await db.redemption.create({
          data: {
            customerId: monthCustomer.id,
            productId,
            advisorId: (
              await db.user.findUniqueOrThrow({
                where: { email: `advisor-${marker}@example.com` },
              })
            ).id,
            companyId,
            storeId,
            pointsCost: 15,
            productName: 'Synthetic Product',
            redeemedAt: new Date(),
            redeemedDate: new Date(Date.UTC(2000, 0, 1)),
          },
        });
      const fifth = await post('/redemptions').send({
        customerId: monthCustomer.id,
        productIds: [productId],
      });
      expect(fifth.status).toBe(409);
      expect(fifth.body.error.code).toBe('MONTHLY_PRODUCT_LIMIT');
    });

    it('revierte dos productos si falta saldo y serializa canjes concurrentes', async () => {
      const invalidSecond = await customer(100);
      expect(
        (
          await post('/redemptions').send({
            customerId: invalidSecond.id,
            productIds: [productId, otherProductId],
          })
        ).status,
      ).toBe(409);
      expect(
        await db.redemption.count({ where: { customerId: invalidSecond.id } }),
      ).toBe(0);
      expect(await getBalance(db, invalidSecond.id)).toBe(100);
      const row = await customer(15);
      expect(
        (
          await post('/redemptions').send({
            customerId: row.id,
            productIds: [productId, productId],
          })
        ).status,
      ).toBe(409);
      expect(await db.redemption.count({ where: { customerId: row.id } })).toBe(
        0,
      );
      expect(await getBalance(db, row.id)).toBe(15);
      const results = await Promise.all([
        post('/redemptions').send({
          customerId: row.id,
          productIds: [productId],
        }),
        post('/redemptions').send({
          customerId: row.id,
          productIds: [productId],
        }),
      ]);
      expect(results.map((result) => result.status).sort()).toEqual([201, 409]);
      expect(await getBalance(db, row.id)).toBe(0);
    });

    it('rechaza baja, tirada duplicada, monto insuficiente y premio incorrecto', async () => {
      const inactive = await customer(50, { status: 'UNSUBSCRIBED' });
      expect(
        (
          await post('/redemptions').send({
            customerId: inactive.id,
            productIds: [productId],
          })
        ).status,
      ).toBe(409);
      expect(
        (
          await post('/dice/rolls').send({
            customerId: inactive.id,
            purchasedItems: [{ productId, quantity: 1 }],
            purchaseAmount: 11,
            die1: 1,
            die2: 1,
          })
        ).status,
      ).toBe(409);
      const row = await customer(30);
      const base = {
        customerId: row.id,
        purchasedItems: [{ productId, quantity: 1 }],
        purchaseAmount: 11,
        die1: 6,
        die2: 6,
      };
      expect(
        (
          await post('/dice/rolls').send({
            ...base,
            purchaseAmount: 10,
            prizeProductId: productId,
          })
        ).status,
      ).toBe(400);
      expect((await post('/dice/rolls').send(base)).status).toBe(400);
      expect(
        (
          await post('/dice/rolls').send({
            ...base,
            prizeProductId: zoneProductId,
          })
        ).status,
      ).toBe(409);
      expect(
        (
          await post('/dice/rolls').send({
            ...base,
            die1: 1,
            prizeProductId: productId,
          })
        ).status,
      ).toBe(400);
      expect(
        (
          await post('/dice/rolls').send({
            ...base,
            customerId: (await customer(0)).id,
            purchasedItems: [{ productId: otherProductId, quantity: 1 }],
            prizeProductId: productId,
          })
        ).status,
      ).toBe(409);
      const won = await post('/dice/rolls').send({
        ...base,
        prizeProductId: productId,
      });
      expect(won.status).toBe(201);
      expect(won.body.isWinner).toBe(true);
      expect(
        (await post('/dice/rolls').send({ ...base, prizeProductId: productId }))
          .status,
      ).toBe(409);
      expect(await getBalance(db, row.id)).toBe(30);
      expect(
        (
          await post('/dice/rolls', adminCookie).send({
            ...base,
            prizeProductId: productId,
          })
        ).status,
      ).toBe(403);
      const race = await customer(0);
      const raceBody = { ...base, customerId: race.id, die1: 1, die2: 2 };
      const concurrent = await Promise.all([
        post('/dice/rolls').send(raceBody),
        post('/dice/rolls').send(raceBody),
      ]);
      expect(concurrent.map((result) => result.status).sort()).toEqual([
        201, 409,
      ]);
      expect(
        concurrent.find((result) => result.status === 201)?.body.isWinner,
      ).toBe(false);
      expect(
        concurrent.find((result) => result.status === 201)?.body.prizeProductId,
      ).toBeNull();
    });

    it('protege catálogo, zonas y usuarios, y audita mutaciones', async () => {
      expect(
        (
          await request(app)
            .patch(`/api/products/${productId}`)
            .set('Cookie', adminCookie)
            .set('X-Requested-With', 'club')
            .send({ name: 'Altered' })
        ).status,
      ).toBe(400);
      expect(
        (
          await request(app)
            .patch(`/api/products/${productId}`)
            .set('Cookie', adminCookie)
            .set('X-Requested-With', 'club')
            .send({ imageKey: 'outside/key' })
        ).status,
      ).toBe(400);
      expect(
        (
          await post('/users', adminCookie).send({
            email: `invalid-${marker}@example.com`,
            firstName: 'No',
            lastName: 'Scope',
            role: 'ADVISOR',
            companyId: null,
            zoneId: null,
            storeId: null,
          })
        ).status,
      ).toBe(400);
      const zone = await post('/zones', adminCookie).send({
        name: `Delete Zone ${marker}`,
        centerLat: 0,
        centerLng: 0,
        radiusMeters: 100,
      });
      expect(zone.status).toBe(201);
      expect(
        (
          await request(app)
            .delete(`/api/zones/${zone.body.id}`)
            .set('Cookie', adminCookie)
            .set('X-Requested-With', 'club')
        ).status,
      ).toBe(200);
      expect(
        (
          await post('/redeemable-products/bulk-assign-zone', adminCookie).send(
            { zoneId: zone.body.id, redeemableProductIds: [redeemableId] },
          )
        ).status,
      ).toBe(409);
      expect(
        await db.auditLog.count({
          where: { action: 'zone.delete', entityId: zone.body.id },
        }),
      ).toBe(1);
      expect(
        (
          await request(app)
            .patch(`/api/products/${productId}`)
            .set('Cookie', adminCookie)
            .set('X-Requested-With', 'club')
            .send({ description: 'Synthetic updated' })
        ).status,
      ).toBe(200);
      expect(
        (
          await request(app)
            .patch(`/api/redeemable-products/${redeemableId}`)
            .set('Cookie', adminCookie)
            .set('X-Requested-With', 'club')
            .send({ active: false })
        ).status,
      ).toBe(200);
      const advisorProducts = await request(app)
        .get('/api/redeemable-products?q=Synthetic Product')
        .set('Cookie', advisorCookie);
      expect(
        advisorProducts.body.data.some(
          (item: { productId: string }) => item.productId === productId,
        ),
      ).toBe(false);
      expect(
        (
          await request(app)
            .get(`/api/products/${productId}`)
            .set('Cookie', adminCookie)
        ).status,
      ).toBe(200);
      const prize = await db.dicePrize.findUniqueOrThrow({
        where: { productId },
      });
      expect(
        (
          await request(app)
            .patch(`/api/dice/prizes/${prize.id}`)
            .set('Cookie', adminCookie)
            .set('X-Requested-With', 'club')
            .send({ active: false })
        ).status,
      ).toBe(200);
      expect(
        (
          await request(app)
            .patch('/api/settings/loyalty')
            .set('Cookie', adminCookie)
            .set('X-Requested-With', 'club')
            .send({ pointsPerDollar: 7 })
        ).status,
      ).toBe(200);
      const newAdmin = await post('/users', adminCookie).send({
        email: `new-${marker}@example.com`,
        firstName: 'New',
        lastName: 'Admin',
        role: 'ADMIN',
        companyId: null,
        zoneId: null,
        storeId: null,
      });
      expect(newAdmin.status).toBe(201);
      expect(newAdmin.body.temporaryPassword).toBeTruthy();
      expect(newAdmin.body.user).not.toHaveProperty('passwordHash');
      for (const action of [
        'product.update',
        'redeemable_product.deactivate',
        'dice_prize.update',
        'settings.update',
        'user.create',
        'zone.create',
        'zone.delete',
      ])
        expect(await db.auditLog.count({ where: { action } })).toBeGreaterThan(
          0,
        );
      const nowParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: '2-digit',
      }).formatToParts(new Date());
      const month = `${nowParts.find((part) => part.type === 'year')?.value}-${nowParts.find((part) => part.type === 'month')?.value}`;
      const summary = await request(app)
        .get(`/api/dashboard/summary?month=${month}`)
        .set('Cookie', adminCookie);
      expect(summary.status).toBe(200);
      expect(summary.body.registered).toBeGreaterThan(0);
      expect(summary.body.unsubscribed).toBeGreaterThan(0);
      expect(summary.body.pointsRedeemed).toBeGreaterThanOrEqual(15);
      expect(
        (
          await request(app)
            .get('/api/audit-logs?action=zone.delete')
            .set('Cookie', adminCookie)
        ).status,
      ).toBe(200);
    });
  },
);
