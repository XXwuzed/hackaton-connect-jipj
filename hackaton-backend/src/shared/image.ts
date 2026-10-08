import type { Storage } from './storage';
import { AppError } from './errors';

/** Firma la lectura solo cuando existe una imagen. */
export async function imageUrl(
  storage: Storage,
  key: string | null,
): Promise<string | null> {
  if (!key) return null;
  if (!storage.getReadUrl)
    throw new AppError(
      503,
      'STORAGE_UNAVAILABLE',
      'Lectura de imágenes no configurada',
    );
  return storage.getReadUrl(key);
}
