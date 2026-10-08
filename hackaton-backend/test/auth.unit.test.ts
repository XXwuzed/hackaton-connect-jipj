import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { signToken, verifyToken } from '../src/modules/auth/auth.tokens';
import { assertResourceScope } from '../src/shared/authz/policies';
import { hasPermission } from '../src/shared/authz/permissions';
import { testConfig } from './helpers/config';

const app = createApp(
  {
    storage: { getUploadUrl: async () => 'https://example.com/upload' },
    mailer: { send: async () => undefined },
  },
  testConfig,
);

describe('auth foundations without database', () => {
  it('does not accept a refresh token as an access token', async () => {
    const token = await signToken('user-id', 'refresh', testConfig);
    await expect(
      verifyToken(token, 'access', testConfig),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('requires the CSRF header on mutations', async () => {
    const response = await request(app).post('/api/auth/login').send({});
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('CSRF_HEADER_REQUIRED');
  });

  it('rejects invalid login data before querying the database', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('X-Requested-With', 'club')
      .send({ email: 'wrong', password: '' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a protected route without cookies', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
  });

  it('keeps admin-only permissions away from advisors', () => {
    expect(hasPermission('ADVISOR', 'settings:update')).toBe(false);
    expect(hasPermission('ADMIN', 'settings:update')).toBe(true);
    expect(hasPermission('ADMIN', 'redemptions:create')).toBe(false);
  });

  it('rejects a resource from another company or zone', () => {
    const advisor = {
      role: 'ADVISOR' as const,
      companyId: 'company-a',
      zoneId: 'zone-a',
      storeId: 'store-a',
    };
    expect(() =>
      assertResourceScope(advisor, {
        companyId: 'company-b',
        zoneId: 'zone-a',
      }),
    ).toThrow();
    expect(() =>
      assertResourceScope(advisor, {
        companyId: 'company-a',
        zoneId: 'zone-b',
      }),
    ).toThrow();
    expect(() =>
      assertResourceScope(advisor, {
        companyId: 'company-a',
        zoneId: 'zone-a',
      }),
    ).not.toThrow();
  });
});
