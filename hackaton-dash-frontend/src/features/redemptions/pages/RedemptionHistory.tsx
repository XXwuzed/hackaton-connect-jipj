import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../../lib/api-client';

interface Row {
  id: string;
  productName: string;
  pointsCost: number;
  redeemedAt: string;
  customer: { firstName: string; lastName: string; nationalId: string };
  advisor: { firstName: string; lastName: string };
  store: { name: string };
}

export default function RedemptionHistory(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const query = useQuery({
    queryKey: ['redemptions', params.toString()],
    queryFn: () =>
      apiRequest<{ data: Row[]; meta: { total: number; has_next: boolean } }>(
        `/redemptions?${params}`,
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
      <h1 className="text-2xl font-bold">Historial de canjes</h1>
      <div className="my-4 flex flex-wrap gap-2">
        <input
          aria-label="Buscar cliente"
          className="rounded border p-2"
          placeholder="Cédula, nombre o correo"
          value={params.get('q') ?? ''}
          onChange={(event) => set('q', event.target.value)}
        />
        <input
          aria-label="Desde"
          type="date"
          className="rounded border p-2"
          value={params.get('from') ?? ''}
          onChange={(event) => set('from', event.target.value)}
        />
        <input
          aria-label="Hasta"
          type="date"
          className="rounded border p-2"
          value={params.get('to') ?? ''}
          onChange={(event) => set('to', event.target.value)}
        />
      </div>
      {query.isPending && <p>Cargando…</p>}
      {query.isError && <p role="alert">No se pudo cargar el historial.</p>}
      {query.data && (
        <>
          <p>{query.data.meta.total} canjes</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Producto</th>
                  <th>Puntos</th>
                  <th>Asesor</th>
                  <th>Tienda</th>
                </tr>
              </thead>
              <tbody>
                {query.data.data.map((row) => (
                  <tr className="border-t" key={row.id}>
                    <td>
                      <Link className="underline" to={`/redemptions/${row.id}`}>
                        {new Date(row.redeemedAt).toLocaleString('es-EC')}
                      </Link>
                    </td>
                    <td>
                      {row.customer.firstName} {row.customer.lastName} (
                      {row.customer.nationalId})
                    </td>
                    <td>{row.productName}</td>
                    <td>{row.pointsCost}</td>
                    <td>
                      {row.advisor.firstName} {row.advisor.lastName}
                    </td>
                    <td>{row.store.name}</td>
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
