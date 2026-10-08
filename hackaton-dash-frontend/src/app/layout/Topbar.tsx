import { useAuth } from '../auth-context';
import { useState } from 'react';

/** Identifica la sesión y permite cerrarla. */
export function Topbar(): JSX.Element {
  const { user, logout } = useAuth();
  const [error, setError] = useState('');
  async function signOut() {
    try {
      await logout();
    } catch {
      setError('No se pudo cerrar sesión. Intenta de nuevo.');
    }
  }
  return (
    <header className="flex justify-between bg-neutral-900 p-4 font-semibold text-white">
      <span>
        EnlaceHermano · {user?.role === 'ADMIN' ? 'Administración' : 'Asesoría'}
      </span>
      {error && <span role="alert">{error}</span>}
      <button onClick={() => void signOut()}>Salir</button>
    </header>
  );
}
