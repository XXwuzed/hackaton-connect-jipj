import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { testConfig } from '../helpers/config';

describe.skipIf(process.env.RUN_DB_TESTS !== '1')(
  'GET /health with PostgreSQL',
  () => {
    it('answers only when the database is reachable', async () => {
      const app = createApp(
        {
          storage: { getUploadUrl: async () => 'https://example.com/upload' },
          mailer: { send: async () => undefined },
        },
        testConfig,
      );
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  },
);
