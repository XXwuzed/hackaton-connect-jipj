import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../../../lib/api-client';

interface Detail {
  productName: string;
  pointsCost: number;
  redeemedAt: string;
  customer: { firstName: string; lastName: string; nationalId: string };
  advisor: { firstName: string; lastName: string };
  store: { name: string };
  lotUsages: {
    id: string;
    points: number;
    lot: { earnedAt: string; expiresAt: string };
  }[];
}
export default function RedemptionDetail(): JSX.Element {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ['redemption', id],
    queryFn: () => apiRequest<Detail>(`/redemptions/${id}`),
    enabled: Boolean(id),
  });
  if (query.isPending) return <p>Cargando canje…</p>;
  if (query.isError) return <p role="alert">No se pudo cargar el canje.</p>;
  const row = query.data;
  return (
    <section>
      <h1 className="text-2xl font-bold">Detalle de canje</h1>
      <p>
        Cliente: {row.customer.firstName} {row.customer.lastName} (
        {row.customer.nationalId})
      </p>
      <p>Producto: {row.productName}</p>
      <p>Puntos: {row.pointsCost}</p>
      <p>Fecha: {new Date(row.redeemedAt).toLocaleString('es-EC')}</p>
      <p>
        Asesor: {row.advisor.firstName} {row.advisor.lastName} ·{' '}
        {row.store.name}
      </p>
      <h2 className="mt-5 font-bold">Lotes consumidos</h2>
      <ul>
        {row.lotUsages.map((usage) => (
          <li key={usage.id}>
            {usage.points} puntos · obtenidos{' '}
            {new Date(usage.lot.earnedAt).toLocaleDateString('es-EC')} · vencen{' '}
            {new Date(usage.lot.expiresAt).toLocaleDateString('es-EC')}
          </li>
        ))}
      </ul>
    </section>
  );
}
