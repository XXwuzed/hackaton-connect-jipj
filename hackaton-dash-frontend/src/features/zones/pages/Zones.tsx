import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Circle, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { apiRequest } from '../../../lib/api-client';

interface Zone {
  id: string;
  name: string;
  centerLat: string;
  centerLng: string;
  radiusMeters: number;
  active: boolean;
}
function PickCenter({
  onPick,
}: {
  onPick(lat: number, lng: number): void;
}): null {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}
export default function Zones(): JSX.Element {
  const client = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [lat, setLat] = useState(-0.21);
  const [lng, setLng] = useState(-78.45);
  const [radius, setRadius] = useState(1000);
  const [error, setError] = useState('');
  const zones = useQuery({
    queryKey: ['zones'],
    queryFn: () => apiRequest<{ data: Zone[] }>('/zones?pageSize=50'),
  });
  function edit(row: Zone) {
    setEditing(row.id);
    setName(row.name);
    setLat(Number(row.centerLat));
    setLng(Number(row.centerLng));
    setRadius(row.radiusMeters);
  }
  async function act(task: () => Promise<unknown>) {
    setError('');
    try {
      await task();
      await client.invalidateQueries({ queryKey: ['zones'] });
      setEditing(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'No se pudo guardar la zona',
      );
    }
  }
  const payload = {
    name,
    centerLat: lat,
    centerLng: lng,
    radiusMeters: radius,
  };
  return (
    <section>
      <h1 className="text-2xl font-bold">Zonas</h1>
      <p>
        Haz clic en el mapa para elegir el centro; el círculo muestra el radio.
      </p>
      <div className="my-4 h-80 overflow-hidden rounded border">
        <MapContainer
          center={[-0.21, -78.45]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <PickCenter
            onPick={(newLat, newLng) => {
              setLat(newLat);
              setLng(newLng);
            }}
          />
          <Circle
            center={[lat, lng]}
            radius={radius}
            pathOptions={{ color: '#087d83', fillColor: '#17bfc3' }}
          />
        </MapContainer>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          className="rounded border p-2"
          aria-label="Nombre de zona"
          placeholder="Nombre"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="w-28 rounded border p-2"
          aria-label="Latitud"
          type="number"
          step="0.000001"
          value={lat}
          onChange={(event) => setLat(Number(event.target.value))}
        />
        <input
          className="w-28 rounded border p-2"
          aria-label="Longitud"
          type="number"
          step="0.000001"
          value={lng}
          onChange={(event) => setLng(Number(event.target.value))}
        />
        <input
          className="w-28 rounded border p-2"
          aria-label="Radio en metros"
          type="number"
          min="1"
          value={radius}
          onChange={(event) => setRadius(Number(event.target.value))}
        />
        <button
          className="rounded bg-primary p-2 text-white"
          onClick={() =>
            act(() =>
              apiRequest(editing ? `/zones/${editing}` : '/zones', {
                method: editing ? 'PATCH' : 'POST',
                body: JSON.stringify(payload),
              }),
            )
          }
        >
          {editing ? 'Guardar cambios' : 'Crear zona'}
        </button>
        {editing && (
          <button
            onClick={() => {
              setEditing(null);
              setName('');
            }}
          >
            Cancelar
          </button>
        )}
      </div>
      {zones.isError && <p role="alert">No se pudieron cargar zonas.</p>}
      {zones.data?.data.map((row) => (
        <article className="flex justify-between border-b p-2" key={row.id}>
          <span>
            {row.name} · {row.radiusMeters} m ·{' '}
            {row.active ? 'Activa' : 'Inactiva'}
          </span>
          <div className="flex gap-3">
            <button className="underline" onClick={() => edit(row)}>
              Editar
            </button>
            <button
              className="underline"
              onClick={() =>
                act(() =>
                  apiRequest(`/zones/${row.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ active: !row.active }),
                  }),
                )
              }
            >
              {row.active ? 'Desactivar' : 'Activar'}
            </button>
            <button
              className="underline"
              onClick={() => {
                if (confirm(`¿Eliminar ${row.name}?`))
                  act(() =>
                    apiRequest(`/zones/${row.id}`, { method: 'DELETE' }),
                  );
              }}
            >
              Eliminar
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
