import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']),
    PORT: z.coerce.number().int().positive(),
    DATABASE_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(1),
    JWT_REFRESH_SECRET: z.string().min(1),
    CORS_ORIGINS: z.string().min(1),
    CUSTOMER_WEB_URL: z.string().url(),
    ADMIN_WEB_URL: z.string().url(),
    CONSENT_VERSION: z.string().min(1).default('draft-v1'),
    AWS_REGION: z.string().min(1),
    AWS_S3_BUCKET: z.string().min(1).optional(),
    AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
    AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    AWS_SESSION_TOKEN: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    MAIL_FROM: z.string().email().default('onboarding@resend.dev'),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV === 'production') {
      if (value.CONSENT_VERSION === 'draft-v1') {
        context.addIssue({
          code: 'custom',
          path: ['CONSENT_VERSION'],
          message:
            'La versión de consentimiento debe aprobarse antes de producción',
        });
      }
      for (const name of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
        if (value[name].length < 32) {
          context.addIssue({
            code: 'custom',
            path: [name],
            message: 'Debe tener al menos 32 caracteres en producción',
          });
        }
      }
      if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) {
        context.addIssue({
          code: 'custom',
          path: ['JWT_REFRESH_SECRET'],
          message: 'Debe ser distinto del secreto de acceso',
        });
      }
    }
    if (
      Boolean(value.AWS_ACCESS_KEY_ID) !== Boolean(value.AWS_SECRET_ACCESS_KEY)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['AWS_ACCESS_KEY_ID'],
        message:
          'AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY deben configurarse juntos',
      });
    }
  });

export type Config = z.infer<typeof schema>;

/** Valida toda la configuración antes de abrir el servidor. */
export function loadConfig(
  environment: NodeJS.ProcessEnv = process.env,
): Config {
  const result = schema.safeParse(environment);
  if (!result.success) {
    throw new Error(
      `Configuración inválida: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`,
    );
  }
  return result.data;
}
