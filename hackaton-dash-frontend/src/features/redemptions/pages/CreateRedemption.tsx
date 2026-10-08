import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '../../../lib/api-client';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  pointsBalance: number;
  status: string;
}
interface Item {
  productId: string;
  pointsRequired: number;
  product: { name: string; imageUrl: string | null };
}
export default function CreateRedemption(): JSX.Element {
  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [selected, setSelected] = useState<Item[]>([]);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const customers = useQuery({
    queryKey: ['canje-customers', search],
    queryFn: () =>
      apiRequest<{ data: Customer[] }>(
        `/customers?scope=all&q=${encodeURIComponent(search)}`,
      ),
    enabled: search.trim().length >= 2,
  });
  const items = useQuery({
    queryKey: ['canje-products', productSearch],
    queryFn: () =>
      apiRequest<{ data: Item[] }>(
        `/redeemable-products?q=${encodeURIComponent(productSearch)}`,
      ),
    enabled: Boolean(customer),
  });
  async function submit() {
    if (!customer || selected.length < 1) return;
    setError('');
    try {
      await apiRequest('/redemptions', {
        method: 'POST',
        body: JSON.stringify({
          customerId: customer.id,
          productIds: selected.map((item) => item.productId),
        }),
      });
      setDone(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo registrar el canje',
      );
    }
  }
  if (done)
    return (
      <section>
        <h1 className="text-2xl font-bold">Canje registrado</h1>
        <p>El saldo se actualizó con los lotes más antiguos.</p>
        <button
          onClick={() => {
            setDone(false);
            setCustomer(null);
            setSelected([]);
          }}
        >
          Registrar otro
        </button>
      </section>
    );
  return (
    <section>
      <h1 className="text-2xl font-bold">Registrar canje</h1>
      <label className="mt-4 block">
        Buscar cliente
        <input
          className="block w-full rounded border p-2"
          placeholder="Cédula, nombre o correo"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      {search.trim().length < 2 && !customer && (
        <p className="mt-2 text-sm text-gray-600">
          Escribe al menos 2 caracteres de la cédula, nombre o correo.
        </p>
      )}
      {search.trim().length >= 2 && customers.data?.data.length === 0 && (
        <p className="mt-2 text-sm text-gray-600">Sin resultados.</p>
      )}
      {!customer &&
        customers.data?.data.map((row) => (
          <button
            key={row.id}
            className="mt-2 block w-full rounded border p-2 text-left"
            disabled={row.status !== 'ACTIVE'}
            onClick={() => setCustomer(row)}
          >
            {row.firstName} {row.lastName} · {row.nationalId} ·{' '}
            {row.pointsBalance} puntos {row.status !== 'ACTIVE' && '(inactivo)'}
          </button>
        ))}
      {customer && (
        <>
          <p className="my-4">
            {customer.firstName} {customer.lastName} · Saldo:{' '}
            {customer.pointsBalance} puntos{' '}
            <button
              className="ml-2 underline"
              onClick={() => {
                setCustomer(null);
                setSelected([]);
              }}
            >
              Cambiar
            </button>
          </p>
          <input
            className="rounded border p-2"
            aria-label="Buscar producto"
            placeholder="Buscar producto"
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
          />
          {items.data?.data.length === 0 && (
            <p className="mt-2 text-sm text-gray-600">
              No hay productos canjeables para tu zona.
            </p>
          )}
          {customer.pointsBalance === 0 && (
            <p className="mt-2 text-sm text-amber-700">
              Este cliente no tiene puntos vigentes; el canje será rechazado.
            </p>
          )}
          {items.data?.data.map((item) => (
            <button
              key={item.productId}
              className="mt-2 flex w-full items-center gap-3 rounded border p-2 text-left"
              disabled={selected.length >= 2}
              onClick={() => setSelected([...selected, item])}
            >
              {item.product.imageUrl && (
                <img
                  className="h-12 w-12 object-cover"
                  alt=""
                  loading="lazy"
                  src={item.product.imageUrl}
                />
              )}
              {item.product.name} · {item.pointsRequired} puntos
            </button>
          ))}
          <h2 className="mt-5 font-bold">Seleccionados</h2>
          <ul>
            {selected.map((item, index) => (
              <li key={`${item.productId}-${index}`}>
                {item.product.name} · {item.pointsRequired}{' '}
                <button
                  className="underline"
                  onClick={() =>
                    setSelected(
                      selected.filter((_, position) => position !== index),
                    )
                  }
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <p>
            Total:{' '}
            {selected.reduce((sum, item) => sum + item.pointsRequired, 0)}{' '}
            puntos
          </p>
          <button
            className="mt-4 rounded bg-primary p-2 text-white"
            disabled={!selected.length}
            onClick={submit}
          >
            Confirmar canje
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
