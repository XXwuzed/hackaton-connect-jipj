import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '../../../lib/api-client';

interface Item {
  id: string;
  pointsRequired?: number;
  product: { name: string; imageUrl: string | null };
}
export default function AdvisorProducts(): JSX.Element {
  const [q, setQ] = useState('');
  const redeemables = useQuery({
    queryKey: ['advisor-redeemables', q],
    queryFn: () =>
      apiRequest<{ data: Item[] }>(
        `/redeemable-products?q=${encodeURIComponent(q)}`,
      ),
  });
  const prizes = useQuery({
    queryKey: ['advisor-prizes', q],
    queryFn: () =>
      apiRequest<{ data: Item[] }>(`/dice/prizes?q=${encodeURIComponent(q)}`),
  });
  return (
    <section>
      <h1 className="text-2xl font-bold">Productos disponibles</h1>
      <input
        className="my-4 rounded border p-2"
        aria-label="Buscar producto"
        placeholder="Buscar producto"
        value={q}
        onChange={(event) => setQ(event.target.value)}
      />
      <h2 className="font-bold">Canjeables en tu zona</h2>
      {redeemables.isError && <p role="alert">No se pudieron cargar.</p>}
      {redeemables.data?.data.map((item) => (
        <p className="border-b p-2" key={item.id}>
          {item.product.imageUrl && (
            <img
              className="inline h-12 w-12 object-cover"
              alt=""
              loading="lazy"
              src={item.product.imageUrl}
            />
          )}{' '}
          {item.product.name} · {item.pointsRequired} puntos
        </p>
      ))}
      <h2 className="mt-5 font-bold">Premios disponibles</h2>
      {prizes.isError && <p role="alert">No se pudieron cargar.</p>}
      {prizes.data?.data.map((item) => (
        <p className="border-b p-2" key={item.id}>
          {item.product.name}
        </p>
      ))}
    </section>
  );
}
