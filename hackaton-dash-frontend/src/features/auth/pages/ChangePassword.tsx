import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/auth-context';

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
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      navigate('/', { replace: true });
    } catch {
      setError(
        'No se pudo cambiar la contraseña. Verifica la contraseña actual.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-3 text-2xl font-bold">Cambia tu contraseña</h1>
      <p className="mb-6">Debes hacerlo antes de usar el panel.</p>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <label className="block">
          Contraseña actual
          <input
            className="mt-1 w-full rounded border p-2"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </label>
        <label className="block">
          Contraseña nueva (mínimo 12 caracteres)
          <input
            className="mt-1 w-full rounded border p-2"
            type="password"
            autoComplete="new-password"
            minLength={12}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </label>
        <label className="block">
          Confirmar contraseña nueva
          <input
            className="mt-1 w-full rounded border p-2"
            type="password"
            autoComplete="new-password"
            minLength={12}
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
          className="rounded bg-primary px-4 py-2 text-white disabled:opacity-50"
          disabled={busy}
        >
          {busy ? 'Guardando…' : 'Cambiar contraseña'}
        </button>
      </form>
    </main>
  );
}
