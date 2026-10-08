async function request<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/public${path}`, {
    method,
    headers: {
      'X-Requested-With': 'club',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error('No se pudo completar la solicitud');
  return response.json() as Promise<T>;
}

/** Consulta la tienda del QR sin exponer su zona. */
export function getStore(
  code: string,
): Promise<{ name: string; company: string }> {
  return request(`/stores/${encodeURIComponent(code)}`);
}

interface Registration {
  nationalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  consent: true;
  storeCode: string;
  recaptchaToken: string;
}

/** Envía una inscripción pública. */
export function registerCustomer(input: Registration): Promise<{ id: string }> {
  return request('/customers', 'POST', input);
}

/** Consulta el enlace de baja sin cambiar estado. */
export function getUnsubscribeInfo(
  token: string,
): Promise<{ name: string; status: string }> {
  return request(`/unsubscribe/${encodeURIComponent(token)}`);
}

/** Confirma la baja mediante POST explícito. */
export function unsubscribe(token: string): Promise<{ status: string }> {
  return request(`/unsubscribe/${encodeURIComponent(token)}`, 'POST');
}
