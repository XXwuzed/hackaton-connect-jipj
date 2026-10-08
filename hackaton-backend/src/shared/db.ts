import { PrismaClient } from '@prisma/client';

// Una sola instancia reutiliza el pool del cliente de Prisma.
export const db = new PrismaClient();
