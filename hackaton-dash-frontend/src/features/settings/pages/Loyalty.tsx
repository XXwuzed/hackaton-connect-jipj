import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '../../../lib/api-client';
export default function Loyalty(): JSX.Element {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['loyalty'],
    queryFn: () => apiRequest<{ pointsPerDollar: number }>('/settings/loyalty'),
  });
  const [factor, setFactor] = useState('');
  const [usd, setUsd] = useState('');
  const [error, setError] = useState('');
  const shownFactor =
    factor === '' ? (query.data?.pointsPerDollar ?? 5) : Number(factor);
  async function save() {
    setError('');
    try {
      await apiRequest('/settings/loyalty', {
        method: 'PATCH',
        body: JSON.stringify({ pointsPerDollar: Number(factor) }),
      });
      await client.invalidateQueries({ queryKey: ['loyalty'] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar');
    }
  }
  return (
    <section>
      <h1 className="text-2xl font-bold">Ajuste de puntos</h1>
      <p>Factor visual; no suma puntos ni altera canjes.</p>
      <label className="mt-4 block">
        1 USD = X puntos
        <input
          className="ml-2 rounded border p-2"
          type="number"
          min="1"
          step="1"
          value={factor === '' ? (query.data?.pointsPerDollar ?? '') : factor}
          onChange={(event) => setFactor(event.target.value)}
        />
      </label>
      <button
        className="mt-3 rounded bg-primary p-2 text-white"
        disabled={factor === '' || Number(factor) < 1}
        onClick={save}
      >
        Guardar
      </button>
      <h2 className="mt-6 font-bold">Calculadora de vista previa</h2>
      <label>
        USD
        <input
          className="ml-2 rounded border p-2"
          type="number"
          min="0"
          step="0.01"
          value={usd}
          onChange={(event) => setUsd(event.target.value)}
        />
      </label>
      <p className="mt-2">
        Puntos estimados: {Math.ceil(Math.max(0, Number(usd)) * shownFactor)}
      </p>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
