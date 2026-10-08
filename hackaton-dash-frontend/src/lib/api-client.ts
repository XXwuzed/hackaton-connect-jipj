export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'ADVISOR';
  companyId: string | null;
  zoneId: string | null;
  storeId: string | null;
  active: boolean;
  mustChangePassword: boolean;
}

class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function send<T>(
  path: string,
  init: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  const method = init.method ?? 'GET';
  const headers = new Headers(init.headers);
  if (method !== 'GET') headers.set('X-Requested-With', 'club');
  if (init.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`/api${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (response.status === 401 && allowRefresh && path !== '/auth/refresh') {
    try {
      await send('/auth/refresh', { method: 'POST' }, false);
      return send<T>(path, init, false);
    } catch {
      // La sesión realmente terminó; se muestra el error original.
    }
  }
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const error =
      typeof payload === 'object' && payload !== null && 'error' in payload
        ? payload.error
        : null;
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : 'REQUEST_FAILED';
    const message =
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
        ? error.message
        : 'No se pudo completar la solicitud';
    throw new ApiError(code, message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

/** Ejecuta una llamada autenticada con renovación puntual de sesión. */
export function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return send<T>(path, init);
}

/** Recupera la sesión activa del panel. */
export async function getMe(): Promise<SessionUser> {
  return (await send<{ user: SessionUser }>('/auth/me')).user;
}

/** Inicia sesión con cookies HTTP-only. */
export async function login(
  email: string,
  password: string,
): Promise<SessionUser> {
  return (
    await send<{ user: SessionUser }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      false,
    )
  ).user;
}

/** Cambia la contraseña propia. */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<SessionUser> {
  return (
    await send<{ user: SessionUser }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  ).user;
}

/** Elimina las cookies de sesión del navegador. */
export async function logout(): Promise<void> {
  await send<void>('/auth/logout', { method: 'POST' }, false);
}
