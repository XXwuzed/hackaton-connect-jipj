import type { Config } from './config';

/** Verifica un token público de reCAPTCHA v3 en el servidor. */
export async function verifyRecaptcha(
  token: string,
  expectedAction: string,
  config: Config,
): Promise<boolean> {
  if (config.RECAPTCHA_BYPASS) return true;
  if (!config.RECAPTCHA_SECRET) return false;
  const body = new URLSearchParams({
    secret: config.RECAPTCHA_SECRET,
    response: token,
  });
  const response = await fetch(
    'https://www.google.com/recaptcha/api/siteverify',
    { method: 'POST', body },
  );
  if (!response.ok) return false;
  const result: unknown = await response.json();
  return (
    typeof result === 'object' &&
    result !== null &&
    'success' in result &&
    result.success === true &&
    'action' in result &&
    result.action === expectedAction &&
    'score' in result &&
    typeof result.score === 'number' &&
    result.score >= 0.5
  );
}
