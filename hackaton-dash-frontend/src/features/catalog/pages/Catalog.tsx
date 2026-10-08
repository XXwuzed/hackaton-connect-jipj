import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '../../../lib/api-client';
import { Icon } from '@club/ui';

interface Product {
  id: string;
  sku: string;
  name: string;
  pvp: string;
  description: string | null;
  imageUrl: string | null;
  companyId: string;
}
export default function Catalog(): JSX.Element {
  const client = useQueryClient();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['catalog', q],
    queryFn: () =>
      apiRequest<{ data: Product[] }>(
        `/products?q=${encodeURIComponent(q)}&pageSize=50`,
      ),
  });
  async function save() {
    if (!editing) return;
    setError('');
    try {
      let imageKey: string | undefined;
      if (image) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type))
          throw new Error('Solo JPEG, PNG o WebP');
        const signed = await apiRequest<{ key: string; uploadUrl: string }>(
          '/uploads/presign',
          { method: 'POST', body: JSON.stringify({ contentType: image.type }) },
        );
        const result = await fetch(signed.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': image.type },
          body: image,
        });
        if (!result.ok) throw new Error('No se pudo subir la imagen');
        imageKey = signed.key;
      }
      await apiRequest(`/products/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          description,
          ...(imageKey ? { imageKey } : {}),
        }),
      });
      await client.invalidateQueries({ queryKey: ['catalog'] });
      setEditing(null);
      setImage(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar');
    }
  }
  return (
    <section>
      <h1 className="text-2xl font-bold">Catálogo</h1>
      <input
        className="my-4 rounded border p-2"
        aria-label="Buscar producto"
        placeholder="Nombre o SKU"
        value={q}
        onChange={(event) => setQ(event.target.value)}
      />
      {query.isError && <p role="alert">No se pudo cargar el catálogo.</p>}
      {query.data?.data.map((row) => (
        <article className="flex items-center gap-4 border-b p-3" key={row.id}>
          {row.imageUrl ? (
            <img
              alt=""
              loading="lazy"
              src={row.imageUrl}
              className="h-16 w-16 object-cover"
            />
          ) : (
            <span className="icon-tile icon-tile--yellow">
              <Icon name="store" />
            </span>
          )}
          <div className="flex-1">
            <p className="font-bold">{row.name}</p>
            <p>
              {row.sku} · ${row.pvp}
            </p>
            <p>{row.description}</p>
          </div>
          <button
            className="underline"
            onClick={() => {
              setEditing(row);
              setDescription(row.description ?? '');
            }}
          >
            Editar imagen/descripción
          </button>
        </article>
      ))}
      {editing && (
        <div className="mt-6 rounded border bg-white p-4">
          <h2 className="font-bold">Editar {editing.name}</h2>
          <p>Nombre, SKU y PVP son de solo lectura.</p>
          <textarea
            className="my-2 block w-full rounded border p-2"
            aria-label="Descripción"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Imagen"
            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
          />
          <button
            className="mt-3 rounded bg-primary p-2 text-white"
            onClick={save}
          >
            Guardar
          </button>
          <button className="ml-3" onClick={() => setEditing(null)}>
            Cancelar
          </button>
          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
