import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { createApp } from '../../src/app';
import { db } from '../../src/shared/db';
import { log } from '../../src/modules/audit';
import { authenticate } from '../../src/shared/middlewares/authenticate';
import { authorize } from '../../src/shared/middlewares/authorize';
import { errorHandler } from '../../src/shared/middlewares/error-handler';
import { testConfig } from '../helpers/config';

const marker = randomUUID();
const password = 'SyntheticTestPassword-123';
let adminEmail: string;
let advisorEmail: string;
let inactiveEmail: string;
let advisorId: string;

const app = createApp(
  {
    storage: { getUploadUrl: async () => 'https://example.com/upload' },
    mailer: { send: async () => undefined },
    prisma: db,
  },
  testConfig,
);

describe.skipIf(process.env.RUN_DB_TESTS !== '1')(
  'auth with club_test PostgreSQL',
  () => {
    beforeAll(async () => {
      const company = await db.company.create({
        data: { name: `Synthetic Test ${marker}` },
      });
      const zone = await db.zone.create({
        data: {
          name: `Synthetic Zone ${marker}`,
          centerLat: 0,
          centerLng: 0,
          radiusMeters: 100,
        },
      });
      const store = await db.store.create({
        data: {
          code: `TEST-${marker}`,
          name: 'Synthetic Store',
          companyId: company.id,
          zoneId: zone.id,
        },
      });
      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
      });
      adminEmail = `admin-${marker}@example.com`;
      advisorEmail = `advisor-${marker}@example.com`;
      inactiveEmail = `inactive-${marker}@example.com`;
      await db.user.create({
        data: {
          email: adminEmail,
          firstName: 'Synthetic',
          lastName: 'Admin',
          role: 'ADMIN',
          passwordHash,
          mustChangePassword: true,
        },
      });
      const advisor = await db.user.create({
        data: {
          email: advisorEmail,
          firstName: 'Synthetic',
          lastName: 'Advisor',
          role: 'ADVISOR',
          passwordHash,
          mustChangePassword: false,
          companyId: company.id,
          zoneId: zone.id,
          storeId: store.id,
        },
      });
      advisorId = advisor.id;
      await db.user.create({
        data: {
          email: inactiveEmail,
          firstName: 'Synthetic',
          lastName: 'Inactive',
          role: 'ADMIN',
          passwordHash,
          active: false,
        },
      });
    });

    it('logs in and returns no password hash', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Requested-With', 'club')
        .send({ email: advisorEmail, password });
      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('ADVISOR');
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('rejects a wrong password and an inactive user', async () => {
      for (const [email, attemptedPassword] of [
        [advisorEmail, 'wrong-password'],
        [inactiveEmail, password],
      ]) {
        const response = await request(app)
          .post('/api/auth/login')
          .set('X-Requested-With', 'club')
          .send({ email, password: attemptedPassword });
        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('blocks other routes until password change, then allows them', async () => {
      const agent = request.agent(app);
      const signedIn = await agent
        .post('/api/auth/login')
        .set('X-Requested-With', 'club')
        .send({ email: adminEmail, password });
      expect(signedIn.status).toBe(200);
      const blocked = await agent
        .post('/api/uploads/presign')
        .set('X-Requested-With', 'club')
        .send({ contentType: 'image/png' });
      expect(blocked.status).toBe(403);
      expect(blocked.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');
      const changed = await agent
        .post('/api/auth/change-password')
        .set('X-Requested-With', 'club')
        .send({
          currentPassword: password,
          newPassword: 'AnotherSyntheticPassword-456',
        });
      expect(changed.status).toBe(200);
      expect(changed.body.user.mustChangePassword).toBe(false);
      const allowed = await agent
        .post('/api/uploads/presign')
        .set('X-Requested-With', 'club')
        .send({ contentType: 'image/png' });
      expect(allowed.status).toBe(200);
      expect(allowed.body.key).toMatch(/^products\//);
    });

    it('rejects advisor on settings:update and unauthenticated callers', async () => {
      const protectedApp = express();
      protectedApp.use(cookieParser());
      protectedApp.get(
        '/check',
        authenticate(db, testConfig),
        authorize('settings:update'),
        (_request, response) => response.json({ ok: true }),
      );
      protectedApp.use(errorHandler);
      expect((await request(protectedApp).get('/check')).status).toBe(401);
      const login = await request(app)
        .post('/api/auth/login')
        .set('X-Requested-With', 'club')
        .send({ email: advisorEmail, password });
      const cookies = login.headers['set-cookie'];
      if (!cookies) throw new Error('No se recibieron cookies de sesión');
      const response = await request(protectedApp)
        .get('/check')
        .set('Cookie', cookies);
      expect(response.status).toBe(403);
    });

    it('rechecks active on every authenticated request', async () => {
      const agent = request.agent(app);
      await agent
        .post('/api/auth/login')
        .set('X-Requested-With', 'club')
        .send({ email: advisorEmail, password });
      await db.user.update({
        where: { id: advisorId },
        data: { active: false },
      });
      expect((await agent.get('/api/auth/me')).status).toBe(401);
      await db.user.update({
        where: { id: advisorId },
        data: { active: true },
      });
    });

    it('rolls back the action when audit insertion fails', async () => {
      const companyName = `Rollback Synthetic ${randomUUID()}`;
      await expect(
        db.$transaction(async (tx) => {
          await tx.company.create({ data: { name: companyName } });
          await log(tx, {
            actorId: randomUUID(),
            actorRole: 'ADMIN',
            action: 'user.create',
            entityType: 'Company',
            entityId: null,
          });
        }),
      ).rejects.toThrow();
      expect(
        await db.company.findUnique({ where: { name: companyName } }),
      ).toBeNull();
    });
  },
);
