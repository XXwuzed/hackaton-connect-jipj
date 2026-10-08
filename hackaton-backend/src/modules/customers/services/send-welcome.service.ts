import type { Config } from '../../../shared/config';
import type { Mailer } from '../../../shared/mailer';
import { createWelcomeEmail } from '../emails/welcome.email';

type WelcomeRecipient = {
  firstName: string;
  email: string;
  unsubscribeToken: string;
};

/** Envía la bienvenida transaccional con el enlace personal de baja del cliente. */
export async function sendWelcomeEmail(
  mailer: Mailer,
  config: Pick<Config, 'CUSTOMER_WEB_URL'>,
  customer: WelcomeRecipient,
): Promise<void> {
  const unsubscribeUrl = new URL(
    `/baja/${encodeURIComponent(customer.unsubscribeToken)}`,
    config.CUSTOMER_WEB_URL,
  ).href;
  const message = createWelcomeEmail(customer.firstName, unsubscribeUrl);
  await mailer.send(
    customer.email,
    message.subject,
    message.html,
    message.text,
  );
}
