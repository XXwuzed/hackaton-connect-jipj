import type { Prisma } from '@prisma/client';

export const safeUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  companyId: true,
  zoneId: true,
  storeId: true,
  active: true,
  mustChangePassword: true,
} as const satisfies Prisma.UserSelect;

export type AuthUser = Prisma.UserGetPayload<{ select: typeof safeUserSelect }>;

export interface RequestContext {
  ip: string | null;
  userAgent: string | null;
}
