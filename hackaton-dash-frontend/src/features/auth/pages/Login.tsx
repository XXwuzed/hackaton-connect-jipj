import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/auth-context';

/** Presenta el formulario de acceso al panel interno. */
export default function Login(): JSX.Element {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user)
    return (
      <Navigate
        to={user.mustChangePassword ? '/change-password' : '/'}
        replace
      />
    );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const current = await login(email, password);
      navigate(current.mustChangePassword ? '/change-password' : '/', {
        replace: true,
      });
    } catch {
      setError('No se pudo iniciar sesión. Revisa tus credenciales.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-6 text-2xl font-bold">Ingresar al panel</h1>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <label className="block">
          Correo
          <input
            className="mt-1 w-full rounded border p-2"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="block">
          Contraseña
          <input
            className="mt-1 w-full rounded border p-2"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
          {busy ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}
