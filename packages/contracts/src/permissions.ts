export const permissions = {
  'dashboard:read': true,
  'product-rotation:read': true,
  'customers:read': true,
  'redemptions:read': true,
  'redemptions:create': true,
  'dice:read': true,
  'dice:create': true,
  'dice-prizes:manage': true,
  'dice-prizes:read': true,
  'catalog:read': true,
  'catalog:update': true,
  'redeemable-products:manage': true,
  'redeemable-products:read': true,
  'zones:manage': true,
  'settings:update': true,
  'users:manage': true,
  'audit:read': true,
  'profile:update': true,
} as const;

export type Permission = keyof typeof permissions;
