import { useEffect, useState, type FormEvent } from 'react';
import { isValidNationalId } from '@club/contracts';
import { getStore, registerCustomer } from '../lib/api';
import { getRecaptchaToken } from '../lib/recaptcha';

/** Inscribe desde el QR de una tienda, sin crear una cuenta del cliente. */
export default function Register(): JSX.Element {
  const storeCode = new URLSearchParams(window.location.search).get('t') ?? '';
  const [store, setStore] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [nationalId, setNationalId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  useEffect(() => {
    if (!storeCode) {
      setError('Falta el código de tienda del QR.');
      return;
    }
    getStore(storeCode)
      .then((value) => setStore(`${value.name} · ${value.company}`))
      .catch(() => setError('Esta tienda no está disponible.'));
  }, [storeCode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidNationalId(nationalId)) {
      setError('La cédula no es válida.');
      return;
    }
    if (!consent) {
      setError('Debes aceptar la política.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const recaptchaToken = await getRecaptchaToken();
      await registerCustomer({
        nationalId,
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        consent: true,
        storeCode,
        recaptchaToken,
      });
      window.location.assign('/success');
    } catch {
      setError(
        'No se pudo completar la inscripción. Revisa los datos e inténtalo nuevamente.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold text-primary">Club Farmaenlace</h1>
      <p className="mt-2">
        Registro gratuito para la demostración con datos sintéticos.
      </p>
      <p className="mt-3 font-medium" role="status">
        {store || 'Consultando tienda…'}
      </p>
      <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
        <label className="block">
          Cédula
          <input
            className="mt-1 w-full rounded border p-2"
            inputMode="numeric"
            maxLength={10}
            value={nationalId}
            onChange={(event) => setNationalId(event.target.value)}
            required
          />
        </label>
        <label className="block">
          Nombre
          <input
            className="mt-1 w-full rounded border p-2"
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
        </label>
        <label className="block">
          Apellido
          <input
            className="mt-1 w-full rounded border p-2"
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
        </label>
        <label className="block">
          Correo
          <input
            className="mt-1 w-full rounded border p-2"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="block">
          Teléfono (opcional)
          <input
            className="mt-1 w-full rounded border p-2"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            required
          />
          <span>Acepto el tratamiento de datos para esta demostración.</span>
        </label>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <button
          className="rounded bg-primary px-4 py-2 text-white disabled:opacity-50"
          disabled={busy || !store}
        >
          {busy ? 'Enviando…' : 'Inscribirme'}
        </button>
      </form>
    </main>
  );
}
