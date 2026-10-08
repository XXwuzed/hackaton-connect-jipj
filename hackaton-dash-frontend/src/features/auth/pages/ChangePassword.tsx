import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/auth-context';
import { Icon } from '@club/ui';
import { authMessages as copy } from '../../../messages/auth';

/** Obliga a reemplazar la contraseña temporal antes de entrar. */
export default function ChangePassword(): JSX.Element {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirm) {
      setError(copy.mismatch);
      return;
    }
    setError('');
    setBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      navigate('/', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.changeError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="password-page">
      <section className="password-card">
        <span className="icon-tile icon-tile--yellow">
          <Icon name="shield" />
        </span>
        <h1>{copy.changeTitle}</h1>
        <p className="login-description">{copy.changeDescription}</p>
        <form
          onSubmit={(event) => void submit(event)}
          className="form-stack"
          aria-busy={busy}
        >
          <label className="field">
            {copy.currentPassword}
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
          <label className="field">
            {copy.newPassword}
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
            <span className="field-hint">{copy.passwordHint}</span>
          </label>
          <label className="field">
            {copy.confirmPassword}
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
            />
          </label>
          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}
          <button
            className="button button--primary button--full"
            disabled={busy}
          >
            {busy ? copy.changeBusy : copy.changeSubmit}
            <Icon name="arrow" />
          </button>
        </form>
      </section>
    </main>
  );
}
