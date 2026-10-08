import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../../lib/api-client';
interface Row {
  id: string;
  action: string;
  actorId: string | null;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
}
export default function Audit(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const query = useQuery({
    queryKey: ['audit', params.toString()],
    queryFn: () =>
      apiRequest<{ data: Row[]; meta: { has_next: boolean } }>(
        `/audit-logs?${params}`,
      ),
  });
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };
  const page = Number(params.get('page') ?? 1);
  return (
    <section>
      <h1 className="text-2xl font-bold">Auditoría</h1>
      <div className="my-4 flex flex-wrap gap-2">
        <input
          className="rounded border p-2"
          aria-label="ID de usuario"
          placeholder="ID de usuario"
          value={params.get('userId') ?? ''}
          onChange={(event) => set('userId', event.target.value)}
        />
        <input
          className="rounded border p-2"
          aria-label="Acción"
          placeholder="Acción"
          value={params.get('action') ?? ''}
          onChange={(event) => set('action', event.target.value)}
        />
        <input
          className="rounded border p-2"
          aria-label="Desde"
          type="date"
          value={params.get('from') ?? ''}
          onChange={(event) => set('from', event.target.value)}
        />
        <input
          className="rounded border p-2"
          aria-label="Hasta"
          type="date"
          value={params.get('to') ?? ''}
          onChange={(event) => set('to', event.target.value)}
        />
      </div>
      {query.isError && <p role="alert">No se pudo cargar auditoría.</p>}
      {query.data?.data.map((row) => (
        <details className="border-b p-2" key={row.id}>
          <summary>
            {new Date(row.createdAt).toLocaleString('es-EC')} · {row.action} ·{' '}
            {row.entityType} {row.entityId} · {row.actorId ?? 'Público'}
          </summary>
          <div className="grid gap-3 md:grid-cols-2">
            <pre className="overflow-x-auto bg-white p-3">
              Antes: {JSON.stringify(row.before, null, 2)}
            </pre>
            <pre className="overflow-x-auto bg-white p-3">
              Después: {JSON.stringify(row.after, null, 2)}
            </pre>
          </div>
        </details>
      ))}
      {query.data && (
        <div className="mt-4 flex gap-4">
          <button
            disabled={page <= 1}
            onClick={() => set('page', String(page - 1))}
          >
            Anterior
          </button>
          <button
            disabled={!query.data.meta.has_next}
            onClick={() => set('page', String(page + 1))}
          >
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
}
