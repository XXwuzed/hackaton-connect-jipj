import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyRecaptcha } from '../src/shared/recaptcha';
import { loadConfig } from '../src/shared/config';
import { testEnvironment } from './helpers/config';

const config = loadConfig({ ...testEnvironment, RECAPTCHA_BYPASS: 'false' });

afterEach(() => vi.unstubAllGlobals());

describe('reCAPTCHA v3 verification', () => {
  it('accepts only the expected action and an adequate score', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, action: 'register', score: 0.9 }),
    });
    vi.stubGlobal('fetch', fetchMock);
    expect(await verifyRecaptcha('synthetic-token', 'register', config)).toBe(
      true,
    );
    expect(
      await verifyRecaptcha('synthetic-token', 'unsubscribe', config),
    ).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
