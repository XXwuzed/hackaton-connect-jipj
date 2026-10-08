import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/shared/config';
import { testEnvironment } from './helpers/config';

describe('startup configuration', () => {
  it('fails clearly without the access secret', () => {
    expect(() =>
      loadConfig({ ...testEnvironment, JWT_ACCESS_SECRET: undefined }),
    ).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('rejects a reCAPTCHA bypass in production', () => {
    expect(() =>
      loadConfig({ ...testEnvironment, NODE_ENV: 'production' }),
    ).toThrow(/RECAPTCHA_BYPASS/);
  });
});
