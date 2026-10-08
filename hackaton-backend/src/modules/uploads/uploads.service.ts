import { randomUUID } from 'node:crypto';
import type { Storage } from '../../shared/storage';

/** Crea una clave privada para subir una imagen de producto. */
export async function presignUpload(storage: Storage, contentType: string) {
  const extension: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const key = `products/${randomUUID()}.${extension[contentType]}`;
  const uploadUrl = await storage.getUploadUrl(key, contentType);
  return { key, uploadUrl, expiresIn: 300 };
}
