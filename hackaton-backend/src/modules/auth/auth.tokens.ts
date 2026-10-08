import type { Response } from 'express';
import { jwtVerify, SignJWT } from 'jose';
import type { Config } from '../../shared/config';
import { UnauthorizedError } from '../../shared/errors';

const issuer = 'club-api';
const audience = 'club-admin';
const accessSeconds = 15 * 60;
const refreshSeconds = 7 * 24 * 60 * 60;

type TokenKind = 'access' | 'refresh';

function key(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/** Firma un token de sesión con tipo y vida útil explícitos. */
export async function signToken(
  userId: string,
  kind: TokenKind,
  config: Config,
): Promise<string> {
  const secret =
    kind === 'access' ? config.JWT_ACCESS_SECRET : config.JWT_REFRESH_SECRET;
  return new SignJWT({ kind })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(
      Math.floor(Date.now() / 1000) +
        (kind === 'access' ? accessSeconds : refreshSeconds),
    )
    .sign(key(secret));
}

/** Verifica firma, audiencia, caducidad y tipo de token. */
export async function verifyToken(
  token: string | undefined,
  kind: TokenKind,
  config: Config,
): Promise<string> {
  if (!token) throw new UnauthorizedError();
  try {
    const secret =
      kind === 'access' ? config.JWT_ACCESS_SECRET : config.JWT_REFRESH_SECRET;
    const { payload } = await jwtVerify(token, key(secret), {
      issuer,
      audience,
    });
    if (payload.kind !== kind || !payload.sub) throw new UnauthorizedError();
    return payload.sub;
  } catch {
    throw new UnauthorizedError();
  }
}

/** Emite cookies no accesibles desde JavaScript. */
export function setSessionCookies(
  response: Response,
  accessToken: string,
  refreshToken: string,
  config: Config,
): void {
  const common = {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  };
  response.cookie('club_access', accessToken, {
    ...common,
    path: '/api',
    maxAge: accessSeconds * 1000,
  });
  response.cookie('club_refresh', refreshToken, {
    ...common,
    path: '/api/auth',
    maxAge: refreshSeconds * 1000,
  });
}

/** Borra las cookies con las mismas rutas de emisión. */
export function clearSessionCookies(response: Response, config: Config): void {
  const common = {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  };
  response.clearCookie('club_access', { ...common, path: '/api' });
  response.clearCookie('club_refresh', { ...common, path: '/api/auth' });
}
