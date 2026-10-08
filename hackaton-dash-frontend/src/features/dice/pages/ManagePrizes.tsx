import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '../../../lib/api-client';

interface Product {
  id: string;
  name: string;
}
interface Zone {
  id: string;
  name: string;
}
interface Prize {
  id: string;
  active: boolean;
  product: Product;
  zones: { zoneId: string }[];
}
export default function ManagePrizes(): JSX.Element {
  const client = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productId, setProductId] = useState('');
  const [zoneIds, setZoneIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const products = useQuery({
    queryKey: ['prize-products'],
    queryFn: () => apiRequest<{ data: Product[] }>('/products?pageSize=50'),
  });
  const zones = useQuery({
    queryKey: ['prize-zones'],
    queryFn: () =>
      apiRequest<{ data: Zone[] }>('/zones?pageSize=50&active=true'),
  });
  const prizes = useQuery({
    queryKey: ['prizes-admin'],
    queryFn: () => apiRequest<{ data: Prize[] }>('/dice/prizes?pageSize=50'),
  });
  async function act(task: () => Promise<unknown>) {
    setError('');
    try {
      await task();
      await client.invalidateQueries({ queryKey: ['prizes-admin'] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar');
    }
  }
  return (
    <section>
      <h1 className="text-2xl font-bold">Premios de dados</h1>
      <div className="my-4 rounded border p-4">
        <h2 className="font-bold">
          {editingId
            ? 'Editar zonas del premio'
            : 'Agregar premio del catálogo'}
        </h2>
        <select
          disabled={Boolean(editingId)}
          className="my-2 rounded border p-2"
          aria-label="Producto premio"
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
        >
          <option value="">Producto…</option>
          {products.data?.data.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        <div>
          {zones.data?.data.map((zone) => (
            <label className="mr-3" key={zone.id}>
              <input
                type="checkbox"
                checked={zoneIds.includes(zone.id)}
                onChange={() =>
                  setZoneIds(
                    zoneIds.includes(zone.id)
                      ? zoneIds.filter((id) => id !== zone.id)
                      : [...zoneIds, zone.id],
                  )
                }
              />{' '}
              {zone.name}
            </label>
          ))}
        </div>
        <button
          className="mt-3 rounded bg-primary p-2 text-white"
          disabled={!productId || !zoneIds.length}
          onClick={() =>
            act(async () => {
              await apiRequest(
                editingId ? `/dice/prizes/${editingId}` : '/dice/prizes',
                {
                  method: editingId ? 'PATCH' : 'POST',
                  body: JSON.stringify(
                    editingId
                      ? { zoneIds }
                      : { productId, zoneIds, active: true },
                  ),
                },
              );
              setEditingId(null);
              setProductId('');
              setZoneIds([]);
            })
          }
        >
          {editingId ? 'Guardar zonas' : 'Agregar'}
        </button>
        {editingId && (
          <button
            className="ml-2"
            onClick={() => {
              setEditingId(null);
              setProductId('');
              setZoneIds([]);
            }}
          >
            Cancelar
          </button>
        )}
      </div>
      {prizes.isError && <p role="alert">No se pudieron cargar premios.</p>}
      {prizes.data?.data.map((row) => (
        <article className="flex justify-between border-b p-2" key={row.id}>
          <span>
            {row.product.name} · {row.active ? 'Activo' : 'Inactivo'}
          </span>
          <div className="flex gap-3">
            <button
              className="underline"
              onClick={() => {
                setEditingId(row.id);
                setProductId(row.product.id);
                setZoneIds(row.zones.map((zone) => zone.zoneId));
              }}
            >
              Editar zonas
            </button>
            <button
              className="underline"
              onClick={() =>
                act(() =>
                  apiRequest(`/dice/prizes/${row.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ active: !row.active }),
                  }),
                )
              }
            >
              {row.active ? 'Desactivar' : 'Activar'}
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
