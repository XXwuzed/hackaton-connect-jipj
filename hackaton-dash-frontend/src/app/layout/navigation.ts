import type { Permission } from '@club/contracts';
import type { IconName } from '@club/ui';
import { navigationMessages as copy } from '../../messages/navigation';

interface NavigationItem {
  label: string;
  to: string;
  icon: IconName;
  permission?: Permission;
}
interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    label: copy.overview,
    items: [{ label: copy.home, to: '/', icon: 'grid' }],
  },
  {
    label: copy.operation,
    items: [
      {
        label: copy.customers,
        to: '/customers',
        icon: 'users',
        permission: 'customers:read',
      },
      {
        label: copy.createRedemption,
        to: '/redemptions/new',
        icon: 'gift',
        permission: 'redemptions:create',
      },
      {
        label: copy.createRoll,
        to: '/dice/new',
        icon: 'dice',
        permission: 'dice:create',
      },
      {
        label: copy.advisorProducts,
        to: '/advisor-products',
        icon: 'store',
        permission: 'redeemable-products:read',
      },
      {
        label: copy.redemptions,
        to: '/redemptions',
        icon: 'gift',
        permission: 'redemptions:read',
      },
      {
        label: copy.rolls,
        to: '/dice/rolls',
        icon: 'dice',
        permission: 'dice:read',
      },
    ],
  },
  {
    label: copy.management,
    items: [
      {
        label: copy.catalog,
        to: '/catalog',
        icon: 'store',
        permission: 'catalog:read',
      },
      {
        label: copy.redeemables,
        to: '/redeemables',
        icon: 'heart',
        permission: 'redeemable-products:manage',
      },
      {
        label: copy.prizes,
        to: '/dice/prizes',
        icon: 'sparkle',
        permission: 'dice-prizes:manage',
      },
      {
        label: copy.zones,
        to: '/zones',
        icon: 'pin',
        permission: 'zones:manage',
      },
      {
        label: copy.rotation,
        to: '/rotation',
        icon: 'chart',
        permission: 'product-rotation:read',
      },
    ],
  },
  {
    label: copy.account,
    items: [
      {
        label: copy.loyalty,
        to: '/settings/loyalty',
        icon: 'settings',
        permission: 'settings:update',
      },
      {
        label: copy.users,
        to: '/users',
        icon: 'users',
        permission: 'users:manage',
      },
      {
        label: copy.audit,
        to: '/audit',
        icon: 'shield',
        permission: 'audit:read',
      },
      {
        label: copy.profile,
        to: '/profile',
        icon: 'user',
        permission: 'profile:update',
      },
    ],
  },
];
