import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '../../../lib/api-client';

interface Product {
  id: string;
  name: string;
  sku: string;
}
interface Zone {
  id: string;
  name: string;
}
interface Item {
  id: string;
  productId: string;
  pointsRequired: number;
  discountPercent: string | null;
  active: boolean;
  product: Product;
  zones: { zoneId: string }[];
}
export default function ManageRedeemables(): JSX.Element {
  const client = useQueryClient();
  const [q, setQ] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productId, setProductId] = useState('');
  const [points, setPoints] = useState(1);
  const [discount, setDiscount] = useState('');
  const [zoneIds, setZoneIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkZoneId, setBulkZoneId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const items = useQuery({
    queryKey: ['redeemables-admin', q],
    queryFn: () =>
      apiRequest<{ data: Item[] }>(
        `/redeemable-products?q=${encodeURIComponent(q)}&pageSize=50`,
      ),
  });
  const products = useQuery({
    queryKey: ['products-select'],
    queryFn: () => apiRequest<{ data: Product[] }>('/products?pageSize=50'),
  });
  const zones = useQuery({
    queryKey: ['zones-select'],
    queryFn: () =>
      apiRequest<{ data: Zone[] }>('/zones?pageSize=50&active=true'),
  });
  async function act(task: () => Promise<unknown>) {
    setError('');
    setMessage('');
    try {
      await task();
      setMessage('Cambios guardados');
      await client.invalidateQueries({ queryKey: ['redeemables-admin'] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar');
    }
  }
  function toggle(id: string) {
    setZoneIds(
      zoneIds.includes(id)
        ? zoneIds.filter((value) => value !== id)
        : [...zoneIds, id],
    );
  }
  return (
    <section>
      <h1 className="text-2xl font-bold">Productos canjeables</h1>
      <input
        className="my-4 rounded border p-2"
        aria-label="Buscar canjeable"
        placeholder="Buscar por nombre"
        value={q}
        onChange={(event) => setQ(event.target.value)}
      />
      <div className="rounded border bg-white p-4">
        <h2 className="font-bold">
          {editingId ? 'Editar canjeable' : 'Vincular desde catálogo'}
        </h2>
        <select
          className="my-2 block rounded border p-2"
          aria-label="Producto"
          disabled={Boolean(editingId)}
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
        >
          <option value="">Producto…</option>
          {products.data?.data.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name} ({row.sku})
            </option>
          ))}
        </select>
        <label>
          Puntos requeridos
          <input
            className="ml-2 rounded border p-2"
            type="number"
            min="1"
            value={points}
            onChange={(event) => setPoints(Number(event.target.value))}
          />
        </label>
        <label className="ml-3">
          Descuento %
          <input
            className="ml-2 rounded border p-2"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={discount}
            onChange={(event) => setDiscount(event.target.value)}
          />
        </label>
        <div className="mt-3">
          Zonas:{' '}
          {zones.data?.data.map((zone) => (
            <label key={zone.id} className="mr-3">
              <input
                type="checkbox"
                checked={zoneIds.includes(zone.id)}
                onChange={() => toggle(zone.id)}
              />{' '}
              {zone.name}
            </label>
          ))}
        </div>
        <button
          className="mt-3 rounded bg-primary p-2 text-white"
          disabled={!productId || !zoneIds.length || points < 1}
          onClick={() =>
            act(async () => {
              await apiRequest(
                editingId
                  ? `/redeemable-products/${editingId}`
                  : '/redeemable-products',
                {
                  method: editingId ? 'PATCH' : 'POST',
                  body: JSON.stringify({
                    ...(!editingId ? { productId } : {}),
                    pointsRequired: points,
                    discountPercent: discount === '' ? null : Number(discount),
                    zoneIds,
                  }),
                },
              );
              setEditingId(null);
              setProductId('');
              setZoneIds([]);
            })
          }
        >
          {editingId ? 'Guardar cambios' : 'Vincular'}
        </button>
        {editingId && (
          <button
            className="ml-3"
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
      <div className="my-4">
        <select
          className="rounded border p-2"
          aria-label="Zona para selección"
          value={bulkZoneId}
          onChange={(event) => setBulkZoneId(event.target.value)}
        >
          <option value="">Asignar seleccionados a zona…</option>
          {zones.data?.data.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name}
            </option>
          ))}
        </select>
        <button
          className="ml-2 rounded border p-2"
          disabled={!bulkZoneId || !selected.length}
          onClick={() =>
            act(() =>
              apiRequest('/redeemable-products/bulk-assign-zone', {
                method: 'POST',
                body: JSON.stringify({
                  zoneId: bulkZoneId,
                  redeemableProductIds: selected,
                }),
              }),
            )
          }
        >
          Asignar a zona
        </button>
      </div>
      {items.isError && <p role="alert">No se pudo cargar la lista.</p>}
      {items.data?.data.map((item) => (
        <article className="flex items-center gap-3 border-b p-2" key={item.id}>
          <input
            type="checkbox"
            checked={selected.includes(item.id)}
            onChange={() =>
              setSelected(
                selected.includes(item.id)
                  ? selected.filter((id) => id !== item.id)
                  : [...selected, item.id],
              )
            }
            aria-label={`Seleccionar ${item.product.name}`}
          />
          <div className="flex-1">
            <strong>{item.product.name}</strong> · {item.pointsRequired} puntos
            · {item.discountPercent ?? 'sin'}% descuento ·{' '}
            {item.active ? 'activo' : 'desvinculado'}
          </div>
          <button
            className="underline"
            onClick={() => {
              setEditingId(item.id);
              setProductId(item.productId);
              setPoints(item.pointsRequired);
              setDiscount(item.discountPercent ?? '');
              setZoneIds(item.zones.map((zone) => zone.zoneId));
            }}
          >
            Editar
          </button>
          <button
            className="underline"
            onClick={() =>
              act(() =>
                apiRequest(`/redeemable-products/${item.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({ active: !item.active }),
                }),
              )
            }
          >
            {item.active ? 'Desvincular' : 'Activar'}
          </button>
        </article>
      ))}
      {message && <p role="status">{message}</p>}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
