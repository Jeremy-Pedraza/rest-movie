import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Plus, Pencil, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { useCrud } from '../hooks/useCrud';
import { mediaService, genresService, directorsService, producersService, typesService } from '../services/crud.service';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';
import alert from '../services/alert';
import type { MediaItem, MediaRelations } from '../types';

interface MediaFormProps {
  initialData: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  loading: boolean;
  isEditing: boolean;
  relations: MediaRelations;
}

function MediaForm({ initialData, onSubmit, loading, relations }: MediaFormProps) {
  const genre = initialData?.genre as Record<string, unknown> | undefined;
  const director = initialData?.director as Record<string, unknown> | undefined;
  const producer = initialData?.producer as Record<string, unknown> | undefined;
  const type = initialData?.type as Record<string, unknown> | undefined;

  const [form, setForm] = useState({
    serial: (initialData?.serial as string) || '',
    title: (initialData?.title as string) || '',
    synopsis: (initialData?.synopsis as string) || '',
    url: (initialData?.url as string) || '',
    coverImage: (initialData?.coverImage as string) || '',
    releaseYear: (initialData?.releaseYear as number) || new Date().getFullYear(),
    genreId: (genre?.id || initialData?.genreId || '') as string | number,
    directorId: (director?.id || initialData?.directorId || '') as string | number,
    producerId: (producer?.id || initialData?.producerId || '') as string | number,
    typeId: (type?.id || initialData?.typeId || '') as string | number,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={(e: FormEvent) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Serial</label>
          <input name="serial" value={form.serial} onChange={handleChange} required maxLength={100} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Año</label>
          <input type="number" name="releaseYear" value={form.releaseYear} onChange={handleChange} required min={1888} max={2100} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Título</label>
        <input name="title" value={form.title} onChange={handleChange} required maxLength={255} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Sinopsis</label>
        <textarea name="synopsis" value={form.synopsis} onChange={handleChange} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">URL</label>
        <input type="url" name="url" value={form.url} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Imagen de portada (URL)</label>
        <input type="url" name="coverImage" value={form.coverImage} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Género</label>
          <select name="genreId" value={form.genreId} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Seleccionar...</option>
            {relations.genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Director</label>
          <select name="directorId" value={form.directorId} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Seleccionar...</option>
            {relations.directors.map((d) => <option key={d.id} value={d.id}>{d.names}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Productora</label>
          <select name="producerId" value={form.producerId} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Seleccionar...</option>
            {relations.producers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tipo</label>
          <select name="typeId" value={form.typeId} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Seleccionar...</option>
            {relations.types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>
      <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
}

export default function MediaPage() {
  const { items, meta, loading, params, setParams, create, update, remove } = useCrud(mediaService);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [relations, setRelations] = useState<MediaRelations>({ genres: [], directors: [], producers: [], types: [] });

  useEffect(() => {
    Promise.allSettled([
      genresService.getAll({ limit: 100 }),
      directorsService.getAll({ limit: 100 }),
      producersService.getAll({ limit: 100 }),
      typesService.getAll({ limit: 100 }),
    ]).then(([g, d, p, t]) => {
      const extract = (res: PromiseSettledResult<unknown>) => {
        if (res.status !== 'fulfilled') return [];
        const val = res.value as { data: { data: { data?: unknown[] } | unknown[] } };
        const payload = val.data.data;
        if (Array.isArray(payload)) return payload;
        if (payload && 'data' in (payload as Record<string, unknown>)) return (payload as { data: unknown[] }).data;
        return [];
      };
      setRelations({
        genres: extract(g) as MediaRelations['genres'],
        directors: extract(d) as MediaRelations['directors'],
        producers: extract(p) as MediaRelations['producers'],
        types: extract(t) as MediaRelations['types'],
      });
    });
  }, []);

  const handleSearch = (search: string) => setParams((prev) => ({ ...prev, search, page: 1 }));

  const handleSubmit = async (data: Record<string, unknown>) => {
    setFormLoading(true);
    try {
      if (editing) await update(editing.id as number, data);
      else await create(data);
      setModalOpen(false);
    } catch {
      // El interceptor global ya maneja el error
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (item: Record<string, unknown>) => {
    const result = await alert.confirmDelete();
    if (!result.isConfirmed) return;

    try {
      await remove(item.id as number);
    } catch {
      // El interceptor global ya maneja el error
    }
  };

  const mediaItems = items as unknown as MediaItem[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Media</h1>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Crear nuevo
        </button>
      </div>

      <div className="mb-4">
        <SearchBar onSearch={handleSearch} placeholder="Buscar por título o serial..." />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        ) : mediaItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No se encontraron registros</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Título</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Serial</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Año</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Género</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Director</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mediaItems.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {item.coverImage && (
                          <img src={item.coverImage} alt="" className="w-8 h-8 rounded object-cover" />
                        )}
                        {item.title}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.serial}</td>
                    <td className="px-4 py-3">{item.releaseYear}</td>
                    <td className="px-4 py-3">{item.genre?.name || '-'}</td>
                    <td className="px-4 py-3">{item.director?.names || '-'}</td>
                    <td className="px-4 py-3">{item.type?.name || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="Ver">
                            <ExternalLink size={15} />
                          </a>
                        )}
                        <button onClick={() => { setEditing(item as unknown as Record<string, unknown>); setModalOpen(true); }} className="p-1.5 hover:bg-blue-50 rounded text-blue-600" title="Editar">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(item as unknown as Record<string, unknown>)} className="p-1.5 hover:bg-red-50 rounded text-red-600" title="Eliminar">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta && <Pagination meta={meta} onPageChange={(page) => setParams((prev) => ({ ...prev, page }))} />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Media' : 'Crear Media'}>
        <MediaForm initialData={editing || {}} onSubmit={handleSubmit} loading={formLoading} isEditing={!!editing} relations={relations} />
      </Modal>
    </div>
  );
}
