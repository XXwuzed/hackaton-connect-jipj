declare global {
  interface Window {
    grecaptcha?: {
      ready(callback: () => void): void;
      execute(siteKey: string, options: { action: string }): Promise<string>;
    };
  }
}

/** Obtiene reCAPTCHA v3 solo cuando se envía el formulario. */
export async function getRecaptchaToken(): Promise<string> {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (!siteKey && import.meta.env.DEV) return 'local-bypass';
  if (!siteKey) throw new Error('reCAPTCHA no configurado');
  if (!window.grecaptcha) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar reCAPTCHA'));
      document.head.appendChild(script);
    });
  }
  if (!window.grecaptcha) throw new Error('reCAPTCHA no disponible');
  await new Promise<void>((resolve) => window.grecaptcha?.ready(resolve));
  return window.grecaptcha.execute(siteKey, { action: 'register' });
}
