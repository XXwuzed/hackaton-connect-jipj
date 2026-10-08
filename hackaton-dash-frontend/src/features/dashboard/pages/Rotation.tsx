import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../../lib/api-client';
interface Row {
  productId: string;
  unitsSold: number;
  margin: string;
  product: { sku: string; name: string; pvp: string };
}
export default function Rotation(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const query = useQuery({
    queryKey: ['rotation', params.toString()],
    queryFn: () =>
      apiRequest<{ data: Row[]; meta: { has_next: boolean } }>(
        `/dashboard/product-rotation?${params}`,
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
      <h1 className="text-2xl font-bold">Rotación y margen</h1>
      <div className="my-4 flex gap-2">
        <input
          className="rounded border p-2"
          aria-label="Buscar producto"
          placeholder="Nombre o SKU"
          value={params.get('q') ?? ''}
          onChange={(event) => set('q', event.target.value)}
        />
        <button
          className="rounded border p-2"
          onClick={() => set('order', 'units_asc')}
        >
          Menos vendidos
        </button>
        <button
          className="rounded border p-2"
          onClick={() => set('order', 'margin_desc')}
        >
          Mayor margen
        </button>
      </div>
      {query.isError && <p role="alert">No se pudo cargar la rotación.</p>}
      {query.data && (
        <>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Unidades</th>
                <th>Margen %</th>
                <th>PVP</th>
              </tr>
            </thead>
            <tbody>
              {query.data.data.map((row) => (
                <tr className="border-t" key={row.productId}>
                  <td>{row.product.name}</td>
                  <td>{row.product.sku}</td>
                  <td>{row.unitsSold}</td>
                  <td>{row.margin}</td>
                  <td>${row.product.pvp}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
