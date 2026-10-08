import type { Permission } from '@club/contracts';

const rolePermissions: Record<'ADMIN' | 'ADVISOR', ReadonlySet<Permission>> = {
  ADMIN: new Set<Permission>([
    'dashboard:read',
    'product-rotation:read',
    'customers:read',
    'redemptions:read',
    'dice:read',
    'dice-prizes:manage',
    'catalog:read',
    'catalog:update',
    'redeemable-products:manage',
    'zones:manage',
    'settings:update',
    'users:manage',
    'audit:read',
    'profile:update',
  ]),
  ADVISOR: new Set<Permission>([
    'customers:read',
    'redemptions:create',
    'dice:create',
    'dice-prizes:read',
    'redeemable-products:read',
    'profile:update',
  ]),
};

/** Oculta opciones no autorizadas; el servidor vuelve a verificar. */
export function canSee(
  role: 'ADMIN' | 'ADVISOR',
  permission: Permission,
): boolean {
  return rolePermissions[role].has(permission);
}
