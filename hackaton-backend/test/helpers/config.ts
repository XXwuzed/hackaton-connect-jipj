import { loadConfig } from '../../src/shared/config';

export const testEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: 'test',
  PORT: '3000',
  DATABASE_URL:
    process.env.DATABASE_URL ??
    'postgresql://club:local-test@localhost:5432/club_test',
  JWT_ACCESS_SECRET: 'local-access-placeholder',
  JWT_REFRESH_SECRET: 'local-refresh-placeholder',
  CORS_ORIGINS: 'http://localhost:5173,http://localhost:5174',
  CUSTOMER_WEB_URL: 'http://localhost:5173',
  ADMIN_WEB_URL: 'http://localhost:5174',
  AWS_REGION: 'us-east-1',
  AWS_S3_BUCKET: 'local-private-bucket',
  AWS_ACCESS_KEY_ID: 'local-placeholder',
  AWS_SECRET_ACCESS_KEY: 'local-placeholder',
  RESEND_API_KEY: 'local-placeholder',
  MAIL_FROM: 'test@example.com',
  RECAPTCHA_SECRET: 'local-placeholder',
  RECAPTCHA_BYPASS: 'true',
};

export const testConfig = loadConfig(testEnvironment);
