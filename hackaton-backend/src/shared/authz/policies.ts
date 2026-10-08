import type { Role } from '@prisma/client';
import { ForbiddenError } from '../errors';

interface ActorScope {
  role: Role;
  companyId: string | null;
  zoneId: string | null;
  storeId: string | null;
}

interface ResourceScope {
  companyId: string;
  zoneId: string;
}

/** Comprueba empresa y zona del asesor sobre un recurso cargado. */
export function assertResourceScope(
  actor: ActorScope,
  resource: ResourceScope,
): void {
  if (actor.role === 'ADMIN') return;
  if (
    !actor.companyId ||
    !actor.zoneId ||
    !actor.storeId ||
    actor.companyId !== resource.companyId ||
    actor.zoneId !== resource.zoneId
  ) {
    throw new ForbiddenError('Recurso fuera de tu empresa o zona');
  }
}
