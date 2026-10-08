import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../../../lib/api-client';
interface Row {
  createdAt: string;
  die1: number;
  die2: number;
  isWinner: boolean;
  purchaseAmount: string;
  customer: { firstName: string; lastName: string; nationalId: string };
  advisor: { firstName: string; lastName: string };
  store: { name: string };
  prizeProduct: { name: string } | null;
  purchasedItems: {
    productId: string;
    quantity: number;
    product: { name: string; sku: string };
  }[];
}
export default function RollDetail(): JSX.Element {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ['roll', id],
    queryFn: () => apiRequest<Row>(`/dice/rolls/${id}`),
    enabled: Boolean(id),
  });
  if (query.isPending) return <p>Cargando…</p>;
  if (query.isError) return <p role="alert">No se pudo cargar la tirada.</p>;
  const row = query.data;
  return (
    <section>
      <h1 className="text-2xl font-bold">Detalle de dados</h1>
      <p>
        {row.customer.firstName} {row.customer.lastName} ·{' '}
        {row.customer.nationalId}
      </p>
      <p>Fecha: {new Date(row.createdAt).toLocaleString('es-EC')}</p>
      <p>
        Asesor: {row.advisor.firstName} {row.advisor.lastName} ·{' '}
        {row.store.name}
      </p>
      <p>Monto: ${row.purchaseAmount}</p>
      <p>
        Dados: {row.die1} y {row.die2}
      </p>
      <p>{row.isWinner ? `Premio: ${row.prizeProduct?.name}` : 'Sin premio'}</p>
      <h2 className="mt-4 font-bold">Productos comprados</h2>
      {row.purchasedItems.map((item) => (
        <p key={item.productId}>
          {item.product.name} ({item.product.sku}) × {item.quantity}
        </p>
      ))}
    </section>
  );
}
