import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { apiRequest } from '../../../lib/api-client';

interface Customer {
  firstName: string;
  lastName: string;
  nationalId: string;
  email: string;
  phone: string | null;
  status: string;
  pointsBalance: number;
  redemptions: Array<{ id: string; productName: string; pointsCost: number }>;
  diceRoll: { id: string; die1: number; die2: number } | null;
}

/** Muestra saldo e historial del cliente consultado. */
export default function CustomerDetail(): JSX.Element {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ['customer', id],
    queryFn: () => apiRequest<Customer>(`/customers/${id}`),
    enabled: Boolean(id),
  });
  if (query.isPending) return <p>Cargando cliente…</p>;
  if (query.isError) return <p role="alert">No se pudo cargar el cliente.</p>;
  const customer = query.data;
  return (
    <section>
      <Link to="/customers" className="underline">
        Volver
      </Link>
      <h1 className="mt-3 text-2xl font-bold">
        {customer.firstName} {customer.lastName}
      </h1>
      <p>
        Cédula: {customer.nationalId} · {customer.email} · {customer.status}
      </p>
      <p className="mt-2 font-semibold">
        Saldo vigente: {customer.pointsBalance} puntos
      </p>
      <h2 className="mt-6 text-xl font-semibold">Canjes</h2>
      {customer.redemptions.length === 0 ? (
        <p>Sin canjes.</p>
      ) : (
        <ul>
          {customer.redemptions.map((item) => (
            <li key={item.id}>
              {item.productName}: {item.pointsCost} puntos
            </li>
          ))}
        </ul>
      )}
      <h2 className="mt-6 text-xl font-semibold">Dados</h2>
      <p>
        {customer.diceRoll
          ? `${customer.diceRoll.die1} y ${customer.diceRoll.die2}`
          : 'Sin tirada.'}
      </p>
    </section>
  );
}
