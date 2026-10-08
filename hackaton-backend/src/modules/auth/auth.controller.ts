import type { Request, Response, NextFunction } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Config } from '../../shared/config';
import { UnauthorizedError } from '../../shared/errors';
import type { ChangePasswordInput, LoginInput } from './auth.dto';
import { clearSessionCookies, setSessionCookies } from './auth.tokens';
import { login } from './services/login.service';
import { refresh } from './services/refresh.service';
import { changePassword } from './services/change-password.service';

function requestContext(request: Request) {
  return {
    ip: request.ip ?? null,
    userAgent: request.get('user-agent') ?? null,
  };
}

/** Traduce el resultado del inicio de sesión a cookies seguras. */
export async function loginController(
  request: Request,
  response: Response,
  next: NextFunction,
  prisma: PrismaClient,
  config: Config,
): Promise<void> {
  try {
    const result = await login(
      prisma,
      request.body as LoginInput,
      requestContext(request),
      config,
    );
    setSessionCookies(
      response,
      result.accessToken,
      result.refreshToken,
      config,
    );
    response.json({ user: result.user });
  } catch (error) {
    next(error);
  }
}

/** Renueva la sesión usando la cookie de refresh. */
export async function refreshController(
  request: Request,
  response: Response,
  next: NextFunction,
  prisma: PrismaClient,
  config: Config,
): Promise<void> {
  try {
    const token =
      typeof request.cookies?.club_refresh === 'string'
        ? request.cookies.club_refresh
        : undefined;
    const result = await refresh(prisma, token, config);
    setSessionCookies(
      response,
      result.accessToken,
      result.refreshToken,
      config,
    );
    response.json({ user: result.user });
  } catch (error) {
    next(error);
  }
}

/** Devuelve el usuario activo sin campos de contraseña. */
export function meController(request: Request, response: Response): void {
  response.json({ user: request.authUser });
}

/** Actualiza la contraseña y libera las rutas protegidas. */
export async function changePasswordController(
  request: Request,
  response: Response,
  next: NextFunction,
  prisma: PrismaClient,
): Promise<void> {
  try {
    if (!request.authUser) throw new UnauthorizedError();
    const user = await changePassword(
      prisma,
      request.authUser,
      request.body as ChangePasswordInput,
      requestContext(request),
    );
    response.json({ user });
  } catch (error) {
    next(error);
  }
}

/** Cierra la sesión del navegador sin invalidar el JWT stateless. */
export function logoutController(response: Response, config: Config): void {
  clearSessionCookies(response, config);
  response.status(204).end();
}
