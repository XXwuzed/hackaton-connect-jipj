import { useEffect, useState } from 'react';
import { getUnsubscribeInfo, unsubscribe } from '../lib/api';

/** Pide confirmación antes del POST para evitar bajas por escáneres de correo. */
export default function Unsubscribe(): JSX.Element {
  const token = window.location.pathname.split('/')[2] ?? '';
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getUnsubscribeInfo(token)
      .then((value) => {
        setName(value.name);
        setStatus(value.status);
      })
      .catch(() => setError('Enlace de baja no válido.'));
  }, [token]);

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      setStatus((await unsubscribe(token)).status);
    } catch {
      setError('No se pudo completar la baja.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold text-primary">Darse de baja</h1>
      {name && <p className="mt-4">Cuenta de {name}</p>}
      {status === 'UNSUBSCRIBED' ? (
        <p className="mt-4" role="status">
          La baja ya está registrada.
        </p>
      ) : (
        name && (
          <button
            className="mt-4 rounded bg-primary px-4 py-2 text-white"
            disabled={busy}
            onClick={() => void confirm()}
          >
            {busy ? 'Procesando…' : 'Confirmar baja'}
          </button>
        )
      )}
      {error && (
        <p className="mt-4 text-red-700" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}
