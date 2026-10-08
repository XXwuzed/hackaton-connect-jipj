import { createApp } from './app';
import { loadConfig } from './shared/config';
import { createMailer } from './shared/mailer';
import { createStorage } from './shared/storage';
import { logger } from './shared/logger';

const config = loadConfig();
const app = createApp(
  { storage: createStorage(config), mailer: createMailer(config) },
  config,
);
app.listen(config.PORT, () => logger.info({ port: config.PORT }, 'API lista'));
