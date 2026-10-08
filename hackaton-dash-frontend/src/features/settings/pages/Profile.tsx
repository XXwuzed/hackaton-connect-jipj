import { useState } from 'react';
import { useAuth } from '../../../app/auth-context';
import { apiRequest, changePassword } from '../../../lib/api-client';
export default function Profile(): JSX.Element {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function saveProfile() {
    setError('');
    try {
      await apiRequest('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ firstName, lastName }),
      });
      setMessage(
        'Información guardada. Actualiza la página para verla en el menú.',
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar');
    }
  }
  async function savePassword() {
    setError('');
    setMessage('');
    if (newPassword !== confirm) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }
    try {
      await changePassword(currentPassword, newPassword);
      setMessage('Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo cambiar la contraseña',
      );
    }
  }
  return (
    <section>
      <h1 className="text-2xl font-bold">Mi información</h1>
      <p>Rol: {user?.role === 'ADMIN' ? 'Administrador' : 'Asesor'}</p>
      <p>Correo: {user?.email}</p>
      <label className="mt-4 block">
        Nombre
        <input
          className="ml-2 rounded border p-2"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
      </label>
      <label className="mt-2 block">
        Apellido
        <input
          className="ml-2 rounded border p-2"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
        />
      </label>
      <button
        className="mt-3 rounded bg-primary p-2 text-white"
        onClick={saveProfile}
      >
        Guardar
      </button>
      <h2 className="mt-6 font-bold">Cambiar contraseña</h2>
      <p className="text-sm text-gray-600">
        Escribe tu contraseña actual y la nueva (mínimo 8 caracteres). La sesión
        sigue abierta; la próxima vez entra con la nueva.
      </p>
      <label className="mt-2 block">
        Contraseña actual
        <input
          className="block rounded border p-2"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </label>
      <label className="mt-2 block">
        Contraseña nueva
        <input
          className="block rounded border p-2"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </label>
      <label className="mt-2 block">
        Confirmar contraseña nueva
        <input
          className="block rounded border p-2"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </label>
      <button
        className="mt-3 rounded bg-primary p-2 text-white disabled:opacity-50"
        disabled={!currentPassword || newPassword.length < 8 || !confirm}
        onClick={savePassword}
      >
        Cambiar contraseña
      </button>
      {message && (
        <p role="status" className="text-green-700">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
