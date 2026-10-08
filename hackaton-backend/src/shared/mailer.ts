import { Resend } from 'resend';
import type { Config } from './config';

export interface Mailer {
  /** Envía el mensaje HTML con una alternativa opcional de texto plano. */
  send(to: string, subject: string, html: string, text?: string): Promise<void>;
}

/** Prepara el proveedor de correo transaccional. */
export function createMailer(config: Config): Mailer {
  const client = config.RESEND_API_KEY
    ? new Resend(config.RESEND_API_KEY)
    : null;
  return {
    async send(to, subject, html, text) {
      if (!client || !config.MAIL_FROM) {
        throw new Error('Correo transaccional no configurado');
      }
      const result = await client.emails.send({
        from: `EnlaceHermano <${config.MAIL_FROM}>`,
        to,
        subject,
        html,
        text,
      });
      if (result.error) throw new Error(`Resend: ${result.error.message}`);
    },
  };
}
