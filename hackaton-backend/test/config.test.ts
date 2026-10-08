import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/shared/config';
import { testEnvironment } from './helpers/config';

describe('startup configuration', () => {
  it('fails clearly without the access secret', () => {
    expect(() =>
      loadConfig({ ...testEnvironment, JWT_ACCESS_SECRET: undefined }),
    ).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('rejects short JWT secrets in production', () => {
    expect(() =>
      loadConfig({
        ...testEnvironment,
        NODE_ENV: 'production',
        CONSENT_VERSION: 'approved-v1',
      }),
    ).toThrow(/JWT_ACCESS_SECRET/);
  });
});
