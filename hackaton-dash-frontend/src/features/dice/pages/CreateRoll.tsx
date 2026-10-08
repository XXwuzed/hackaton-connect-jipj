import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '../../../lib/api-client';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  status: string;
}
interface Product {
  id: string;
  name: string;
}
interface Prize {
  id: string;
  productId: string;
  product: { name: string };
}
export default function CreateRoll(): JSX.Element {
  const [step, setStep] = useState(0),
    [search, setSearch] = useState(''),
    [customer, setCustomer] = useState<Customer | null>(null);
  const [productId, setProductId] = useState(''),
    [quantity, setQuantity] = useState(1),
    [amount, setAmount] = useState(''),
    [productSearch, setProductSearch] = useState('');
  const [purchasedItems, setPurchasedItems] = useState<
    { productId: string; quantity: number; name: string }[]
  >([]);
  const [die1, setDie1] = useState(0),
    [die2, setDie2] = useState(0),
    [prizeProductId, setPrizeProductId] = useState('');
  const [error, setError] = useState(''),
    [done, setDone] = useState(false);
  const customers = useQuery({
    queryKey: ['dice-customers', search],
    queryFn: () =>
      apiRequest<{ data: Customer[] }>(
        `/customers?scope=all&q=${encodeURIComponent(search)}`,
      ),
    enabled: search.trim().length >= 2,
  });
  const products = useQuery({
    queryKey: ['dice-products', productSearch],
    queryFn: () =>
      apiRequest<{ data: Product[] }>(
        `/products?pageSize=50&q=${encodeURIComponent(productSearch)}`,
      ),
    enabled: step >= 1,
  });
  const prizes = useQuery({
    queryKey: ['dice-prizes'],
    queryFn: () => apiRequest<{ data: Prize[] }>('/dice/prizes'),
    enabled: step >= 3 && die1 === 6 && die2 === 6,
  });
  async function selectCustomer(row: Customer) {
    setError('');
    try {
      const detail = await apiRequest<{ diceRoll: { id: string } | null }>(
        `/customers/${row.id}`,
      );
      if (detail.diceRoll) {
        setError('Este cliente ya tiró los dados');
        return;
      }
      setCustomer(row);
      setStep(1);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo consultar el cliente',
      );
    }
  }
  async function submit() {
    if (!customer || !purchasedItems.length) return;
    setError('');
    try {
      await apiRequest('/dice/rolls', {
        method: 'POST',
        body: JSON.stringify({
          customerId: customer.id,
          purchasedItems: purchasedItems.map(
            ({ productId: id, quantity: count }) => ({
              productId: id,
              quantity: count,
            }),
          ),
          purchaseAmount: Number(amount),
          die1,
          die2,
          ...(die1 === 6 && die2 === 6 ? { prizeProductId } : {}),
        }),
      });
      setDone(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo registrar la tirada',
      );
    }
  }
  if (done)
    return (
      <section>
        <h1 className="text-2xl font-bold">Resultado registrado</h1>
        <p>
          {die1 === 6 && die2 === 6 ? '¡Ganó un premio!' : 'Tirada sin premio.'}
        </p>
      </section>
    );
  return (
    <section>
      <h1 className="text-2xl font-bold">Registrar resultado de dados</h1>
      <p>Paso {step + 1} de 4</p>
      {step === 0 && (
        <>
          <input
            className="mt-4 rounded border p-2"
            aria-label="Buscar cliente"
            placeholder="Cédula, nombre o correo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search.trim().length < 2 && !customer && (
            <p className="mt-2 text-sm text-gray-600">
              Escribe al menos 2 caracteres de la cédula, nombre o correo.
            </p>
          )}
          {search.trim().length >= 2 && customers.data?.data.length === 0 && (
            <p className="mt-2 text-sm text-gray-600">Sin resultados.</p>
          )}
          {customers.data?.data.map((row) => (
            <button
              className="mt-2 block w-full rounded border p-2 text-left"
              key={row.id}
              disabled={row.status !== 'ACTIVE'}
              onClick={() => selectCustomer(row)}
            >
              {row.firstName} {row.lastName} · {row.nationalId}
            </button>
          ))}
        </>
      )}
      {step === 1 && (
        <>
          <p className="my-3">
            Cliente: {customer?.firstName} {customer?.lastName}
          </p>
          <input
            className="rounded border p-2"
            aria-label="Buscar producto comprado"
            placeholder="Buscar producto"
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
          />
          <label className="block">
            Producto comprado
            <select
              className="block w-full rounded border p-2"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
            >
              <option value="">Elige un producto</option>
              {products.data?.data.map((product) => (
                <option value={product.id} key={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Cantidad
            <input
              className="block rounded border p-2"
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </label>
          <button
            className="rounded border p-2"
            disabled={
              !productId ||
              quantity < 1 ||
              purchasedItems.some((item) => item.productId === productId)
            }
            onClick={() => {
              const product = products.data?.data.find(
                (item) => item.id === productId,
              );
              if (product) {
                setPurchasedItems([
                  ...purchasedItems,
                  { productId, quantity, name: product.name },
                ]);
                setProductId('');
              }
            }}
          >
            Agregar producto
          </button>
          <ul className="my-3">
            {purchasedItems.map((item) => (
              <li key={item.productId}>
                {item.name} × {item.quantity}{' '}
                <button
                  className="underline"
                  onClick={() =>
                    setPurchasedItems(
                      purchasedItems.filter(
                        (row) => row.productId !== item.productId,
                      ),
                    )
                  }
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <label className="block">
            Monto de compra (USD)
            <input
              className="block rounded border p-2"
              type="number"
              min="10.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <button
            disabled={!purchasedItems.length || Number(amount) <= 10}
            onClick={() => setStep(2)}
          >
            Siguiente
          </button>
        </>
      )}
      {step === 2 && (
        <>
          <h2 className="my-3 font-bold">¿Qué salió en el dado 1?</h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((value) => (
              <button
                className={`rounded border p-3 ${die1 === value ? 'bg-primary text-white' : ''}`}
                onClick={() => {
                  setDie1(value);
                  setStep(3);
                }}
                key={value}
              >
                {value}
              </button>
            ))}
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <h2 className="my-3 font-bold">¿Y en el dado 2?</h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((value) => (
              <button
                className={`rounded border p-3 ${die2 === value ? 'bg-primary text-white' : ''}`}
                onClick={() => setDie2(value)}
                key={value}
              >
                {value}
              </button>
            ))}
          </div>
          {die2 > 0 && (
            <>
              <p className="mt-4">
                Resultado: {die1} y {die2}.{' '}
                {die1 === 6 && die2 === 6 ? '¡Ganador!' : 'Sin premio.'}
              </p>
              {die1 === 6 && die2 === 6 && (
                <label className="block">
                  Premio
                  <select
                    className="block rounded border p-2"
                    value={prizeProductId}
                    onChange={(event) => setPrizeProductId(event.target.value)}
                  >
                    <option value="">Elige el premio</option>
                    {prizes.data?.data.map((item) => (
                      <option key={item.id} value={item.productId}>
                        {item.product.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button
                className="mt-4 rounded bg-primary p-2 text-white"
                disabled={die1 === 6 && die2 === 6 && !prizeProductId}
                onClick={submit}
              >
                Confirmar resultado
              </button>
            </>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="mt-4 text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
