import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../../lib/api-client';

interface Row {
  id: string;
  createdAt: string;
  die1: number;
  die2: number;
  isWinner: boolean;
  purchaseAmount: string;
  customer: { firstName: string; lastName: string; nationalId: string };
  prizeProduct: { name: string } | null;
}
export default function RollHistory(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const query = useQuery({
    queryKey: ['rolls', params.toString()],
    queryFn: () =>
      apiRequest<{ data: Row[]; meta: { total: number; has_next: boolean } }>(
        `/dice/rolls?${params}`,
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
      <h1 className="text-2xl font-bold">Historial de dados</h1>
      <div className="my-4 flex gap-2">
        <input
          className="rounded border p-2"
          aria-label="Buscar cliente"
          placeholder="Cliente"
          value={params.get('q') ?? ''}
          onChange={(event) => set('q', event.target.value)}
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
      {query.isError && <p role="alert">No se pudo cargar el historial.</p>}
      {query.data && (
        <>
          <p>{query.data.meta.total} tiradas</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Dados</th>
                  <th>Resultado</th>
                  <th>Compra</th>
                </tr>
              </thead>
              <tbody>
                {query.data.data.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td>
                      <Link className="underline" to={`/dice/rolls/${row.id}`}>
                        {new Date(row.createdAt).toLocaleString('es-EC')}
                      </Link>
                    </td>
                    <td>
                      {row.customer.firstName} {row.customer.lastName} (
                      {row.customer.nationalId})
                    </td>
                    <td>
                      {row.die1} + {row.die2}
                    </td>
                    <td>
                      {row.isWinner
                        ? `Premio: ${row.prizeProduct?.name}`
                        : 'Sin premio'}
                    </td>
                    <td>${row.purchaseAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        </>
      )}
    </section>
  );
}
