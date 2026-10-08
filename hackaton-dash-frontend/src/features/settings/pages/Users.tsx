import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '../../../lib/api-client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'ADVISOR';
  companyId: string | null;
  zoneId: string | null;
  storeId: string | null;
  active: boolean;
  mustChangePassword: boolean;
}
interface Option {
  id: string;
  name: string;
  companyId?: string;
  zoneId?: string;
}
interface Result {
  data: User[];
  options: { companies: Option[]; zones: Option[]; stores: Option[] };
}
export default function Users(): JSX.Element {
  const client = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'ADVISOR'>('ADVISOR');
  const [companyId, setCompanyId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [error, setError] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const query = useQuery({
    queryKey: ['users'],
    queryFn: () => apiRequest<Result>('/users?pageSize=50'),
  });
  async function act(task: () => Promise<unknown>) {
    setError('');
    try {
      await task();
      await client.invalidateQueries({ queryKey: ['users'] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar');
    }
  }
  async function save() {
    await act(async () => {
      const result = await apiRequest<{ temporaryPassword?: string }>(
        editingId ? `/users/${editingId}` : '/users',
        {
          method: editingId ? 'PATCH' : 'POST',
          body: JSON.stringify({
            email,
            firstName,
            lastName,
            role,
            companyId: role === 'ADMIN' ? null : companyId,
            zoneId: role === 'ADMIN' ? null : zoneId,
            storeId: role === 'ADMIN' ? null : storeId,
          }),
        },
      );
      if (result.temporaryPassword)
        setTemporaryPassword(result.temporaryPassword);
      setEditingId(null);
      setEmail('');
      setFirstName('');
      setLastName('');
    });
  }
  async function reset(id: string) {
    await act(async () => {
      const result = await apiRequest<{ temporaryPassword: string }>(
        `/users/${id}/reset-password`,
        { method: 'POST' },
      );
      setTemporaryPassword(result.temporaryPassword);
    });
  }
  return (
    <section>
      <h1 className="text-2xl font-bold">Usuarios</h1>
      <p>
        La contraseña temporal se muestra una sola vez; entrégala por un canal
        privado.
      </p>
      {temporaryPassword && (
        <p role="status" className="my-3 rounded border bg-yellow-50 p-3">
          Contraseña temporal: <code>{temporaryPassword}</code>{' '}
          <button
            className="ml-2 underline"
            onClick={() => setTemporaryPassword('')}
          >
            Ocultar
          </button>
        </p>
      )}
      <div className="my-4 flex flex-wrap gap-2 rounded border bg-white p-4">
        <h2 className="w-full font-bold">
          {editingId ? 'Editar usuario' : 'Crear usuario'}
        </h2>
        <input
          className="rounded border p-2"
          aria-label="Correo"
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="rounded border p-2"
          aria-label="Nombre"
          placeholder="Nombre"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
        <input
          className="rounded border p-2"
          aria-label="Apellido"
          placeholder="Apellido"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
        />
        <select
          className="rounded border p-2"
          aria-label="Rol"
          value={role}
          onChange={(event) =>
            setRole(event.target.value as 'ADMIN' | 'ADVISOR')
          }
        >
          <option value="ADVISOR">Asesor</option>
          <option value="ADMIN">Administrador</option>
        </select>
        {role === 'ADVISOR' && (
          <>
            <select
              className="rounded border p-2"
              aria-label="Empresa"
              value={companyId}
              onChange={(event) => {
                setCompanyId(event.target.value);
                setStoreId('');
              }}
            >
              <option value="">Empresa</option>
              {query.data?.options.companies.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <select
              className="rounded border p-2"
              aria-label="Zona"
              value={zoneId}
              onChange={(event) => {
                setZoneId(event.target.value);
                setStoreId('');
              }}
            >
              <option value="">Zona</option>
              {query.data?.options.zones.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <select
              className="rounded border p-2"
              aria-label="Tienda"
              value={storeId}
              onChange={(event) => setStoreId(event.target.value)}
            >
              <option value="">Tienda</option>
              {query.data?.options.stores
                .filter(
                  (option) =>
                    option.companyId === companyId && option.zoneId === zoneId,
                )
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
            </select>
          </>
        )}
        <button
          className="rounded bg-primary p-2 text-white"
          disabled={
            !email ||
            !firstName ||
            !lastName ||
            (role === 'ADVISOR' && (!companyId || !zoneId || !storeId))
          }
          onClick={save}
        >
          {editingId ? 'Guardar cambios' : 'Crear usuario'}
        </button>
        {editingId && (
          <button onClick={() => setEditingId(null)}>Cancelar</button>
        )}
      </div>
      {query.isError && <p role="alert">No se pudieron cargar usuarios.</p>}
      {query.data?.data.map((row) => (
        <article
          className="flex flex-wrap items-center justify-between gap-3 border-b p-2"
          key={row.id}
        >
          <div>
            <strong>
              {row.firstName} {row.lastName}
            </strong>{' '}
            · {row.email} · {row.role} · {row.active ? 'Activo' : 'Inactivo'}
            {row.mustChangePassword && ' · cambio pendiente'}
          </div>
          <div className="flex gap-3">
            <button
              className="underline"
              onClick={() => {
                setEditingId(row.id);
                setEmail(row.email);
                setFirstName(row.firstName);
                setLastName(row.lastName);
                setRole(row.role);
                setCompanyId(row.companyId ?? '');
                setZoneId(row.zoneId ?? '');
                setStoreId(row.storeId ?? '');
              }}
            >
              Editar
            </button>
            <button
              className="underline"
              onClick={() =>
                act(() =>
                  apiRequest(`/users/${row.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ active: !row.active }),
                  }),
                )
              }
            >
              {row.active ? 'Desactivar' : 'Activar'}
            </button>
            <button className="underline" onClick={() => reset(row.id)}>
              Restablecer contraseña
            </button>
          </div>
        </article>
      ))}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
