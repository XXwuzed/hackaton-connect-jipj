import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Config } from './config';
import { AppError } from './errors';

export interface Storage {
  getUploadUrl(key: string, contentType: string): Promise<string>;
  getReadUrl?(key: string): Promise<string>;
}

/** Prepara el cliente privado de S3 para futuras URLs prefirmadas. */
export function createStorage(config: Config): Storage {
  const client = new S3Client({
    region: config.AWS_REGION,
    ...(config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY
      ? {
          credentials: {
            accessKeyId: config.AWS_ACCESS_KEY_ID,
            secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
            sessionToken: config.AWS_SESSION_TOKEN,
          },
        }
      : {}),
  });
  return {
    getUploadUrl(key, contentType) {
      if (!config.AWS_S3_BUCKET) {
        throw new AppError(
          503,
          'STORAGE_UNAVAILABLE',
          'Almacenamiento no configurado',
        );
      }
      const command = new PutObjectCommand({
        Bucket: config.AWS_S3_BUCKET,
        Key: key,
        ContentType: contentType,
      });
      return getSignedUrl(client, command, { expiresIn: 300 });
    },
    getReadUrl(key) {
      if (!config.AWS_S3_BUCKET)
        throw new AppError(
          503,
          'STORAGE_UNAVAILABLE',
          'Almacenamiento no configurado',
        );
      return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: config.AWS_S3_BUCKET, Key: key }),
        { expiresIn: 300 },
      );
    },
  };
}
