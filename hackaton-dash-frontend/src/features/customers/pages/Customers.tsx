import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../app/auth-context';
import { apiRequest } from '../../../lib/api-client';
import { Icon, LoadingState } from '@club/ui';
import { customersMessages as copy } from '../../../messages/customers';

interface CustomerRow {
  id: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  pointsBalance: number;
  createdAt: string;
}

/** Lista clientes conservando búsqueda y filtros en la URL. */
export default function Customers(): JSX.Element {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const query = useQuery({
    queryKey: ['customers', params.toString()],
    queryFn: () =>
      apiRequest<{
        data: CustomerRow[];
        meta: { total: number; has_next: boolean };
      }>(`/customers?${params}`),
  });
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  }
  const page = Number(params.get('page') ?? 1);
  return (
    <section>
      <h1 className="text-2xl font-bold">Clientes</h1>
      <p>{copy.description}</p>
      <div className="my-4 flex flex-wrap gap-3">
        <input
          aria-label="Buscar cédula, nombre o correo"
          placeholder="Buscar cliente"
          className="rounded border p-2"
          value={params.get('q') ?? ''}
          onChange={(event) => setParam('q', event.target.value)}
        />
        <input
          aria-label="Desde"
          type="date"
          className="rounded border p-2"
          value={params.get('from') ?? ''}
          onChange={(event) => setParam('from', event.target.value)}
        />
        <input
          aria-label="Hasta"
          type="date"
          className="rounded border p-2"
          value={params.get('to') ?? ''}
          onChange={(event) => setParam('to', event.target.value)}
        />
        <select
          aria-label="Orden"
          className="rounded border p-2"
          value={params.get('order') ?? 'created_desc'}
          onChange={(event) => setParam('order', event.target.value)}
        >
          <option value="created_desc">Más recientes</option>
          <option value="points_desc">Más puntos</option>
        </select>
        {user?.role === 'ADVISOR' && (
          <select
            aria-label="Alcance"
            className="rounded border p-2"
            value={params.get('scope') ?? 'all'}
            onChange={(event) => setParam('scope', event.target.value)}
          >
            <option value="all">Todos</option>
            <option value="zone">Mi zona</option>
          </select>
        )}
      </div>
      {query.isPending && <LoadingState label={copy.loading} />}
      {query.isError && <p role="alert">No se pudieron cargar los clientes.</p>}
      {query.data && (
        <>
          <p className="table-caption">
            {new Intl.NumberFormat('es-EC').format(query.data.meta.total)}{' '}
            clientes
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Cédula</th>
                  <th>Correo</th>
                  <th>Puntos</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {query.data.data.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="py-2">
                      <div className="customer-cell">
                        <span className="user-avatar" aria-hidden="true">
                          {item.firstName.charAt(0)}
                          {item.lastName.charAt(0)}
                        </span>
                        <Link
                          className="underline"
                          to={`/customers/${item.id}`}
                        >
                          {item.firstName} {item.lastName}
                        </Link>
                      </div>
                    </td>
                    <td>{item.nationalId}</td>
                    <td>{item.email}</td>
                    <td className="font-semibold">
                      {new Intl.NumberFormat('es-EC').format(
                        item.pointsBalance,
                      )}
                    </td>
                    <td>
                      <span
                        className={`status-badge${item.status !== 'ACTIVE' ? ' status-badge--inactive' : ''}`}
                      >
                        {item.status === 'ACTIVE' ? copy.active : copy.inactive}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {query.data.data.length === 0 && (
              <div className="empty-state">
                <Icon name="search" />
                <p>{copy.empty}</p>
              </div>
            )}
          </div>
          <div className="pagination mt-4 flex gap-2">
            <span>
              {copy.page} {page}
            </span>
            <button
              disabled={page <= 1}
              onClick={() => setParam('page', String(page - 1))}
            >
              Anterior
            </button>
            <button
              disabled={!query.data.meta.has_next}
              onClick={() => setParam('page', String(page + 1))}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </section>
  );
}
