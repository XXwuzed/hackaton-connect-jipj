import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../../app/auth-context';
import { apiRequest } from '../../../lib/api-client';

interface Summary {
  month: string;
  registered: number;
  unsubscribed: number;
  pointsRedeemed: number;
}
export default function Dashboard(): JSX.Element {
  const { user } = useAuth();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const query = useQuery({
    queryKey: ['summary', month],
    queryFn: () => apiRequest<Summary>(`/dashboard/summary?month=${month}`),
    enabled: user?.role === 'ADMIN',
  });
  if (user?.role !== 'ADMIN')
    return (
      <section>
        <h1 className="text-2xl font-bold">Bienvenido, {user?.firstName}</h1>
        <p>Desde el menú puedes buscar clientes, registrar canjes y dados.</p>
      </section>
    );
  return (
    <section>
      <h1 className="text-2xl font-bold">Resumen de EnlaceHermano</h1>
      <label className="my-4 block">
        Mes{' '}
        <input
          className="ml-2 rounded border p-2"
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
        />
      </label>
      {query.isPending && <p>Cargando…</p>}
      {query.isError && <p role="alert">No se pudo cargar el resumen.</p>}
      {query.data && (
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded bg-white p-5 shadow">
            <h2>Inscritos</h2>
            <p className="text-3xl font-bold">{query.data.registered}</p>
          </article>
          <article className="rounded bg-white p-5 shadow">
            <h2>Dados de baja</h2>
            <p className="text-3xl font-bold">{query.data.unsubscribed}</p>
          </article>
          <article className="rounded bg-white p-5 shadow">
            <h2>Puntos canjeados</h2>
            <p className="text-3xl font-bold">{query.data.pointsRedeemed}</p>
          </article>
        </div>
      )}
    </section>
  );
}
