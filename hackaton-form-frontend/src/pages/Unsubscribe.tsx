import { useEffect, useState } from 'react';
import { getUnsubscribeInfo, unsubscribe } from '../lib/api';
import { Icon, LoadingState } from '@club/ui';
import { PublicLayout } from '../components/PublicLayout';
import { publicMessages } from '../messages/public';

const copy = publicMessages.unsubscribe;

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
      .catch(() => setError(copy.invalid));
  }, [token]);

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      setStatus((await unsubscribe(token)).status);
    } catch {
      setError(copy.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <PublicLayout>
      <main id="main-content" className="confirmation-layout">
        <section className="confirmation-card">
          <span className="icon-tile icon-tile--coral">
            <Icon name={status === 'UNSUBSCRIBED' ? 'check' : 'heart'} />
          </span>
          <h1>{copy.title}</h1>
          {name && (
            <p>
              {copy.member} <strong>{name}</strong>
            </p>
          )}
          {status === 'UNSUBSCRIBED' ? (
            <p role="status">{copy.done}</p>
          ) : name ? (
            <>
              <p>{copy.description}</p>
              <button
                className="button button--primary"
                disabled={busy}
                onClick={() => void confirm()}
              >
                {busy ? copy.busy : copy.submit}
              </button>
            </>
          ) : (
            !error && <LoadingState label={copy.loading} />
          )}
          {error && <p role="alert">{error}</p>}
        </section>
      </main>
    </PublicLayout>
  );
}
