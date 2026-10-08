import type { Role } from '@prisma/client';
import type { Permission } from '@club/contracts';

const rolePermissions: Record<Role, ReadonlySet<Permission>> = {
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

/** Comprueba el permiso de un rol sin depender de la interfaz. */
export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].has(permission);
}
