import { Search, X } from 'lucide-react';
import type { Genre, MediaType, CatalogParams } from '../../types';

interface FilterBarProps {
  params: CatalogParams;
  genres: Genre[];
  types: MediaType[];
  onParamsChange: (params: CatalogParams) => void;
}

export default function FilterBar({ params, genres, types, onParamsChange }: FilterBarProps) {
  const update = (partial: Partial<CatalogParams>) => {
    onParamsChange({ ...params, page: 1, ...partial });
  };

  const hasFilters = params.search || params.genreId || params.typeId || params.releaseYear;

  const clearFilters = () => {
    onParamsChange({ page: 1, limit: params.limit });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={params.search || ''}
          onChange={(e) => update({ search: e.target.value || undefined })}
          placeholder="Buscar películas, series..."
          className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-red-500 placeholder-gray-500"
        />
      </div>

      {/* Genre */}
      <select
        value={params.genreId || ''}
        onChange={(e) => update({ genreId: e.target.value || undefined })}
        className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-red-500"
      >
        <option value="">Todos los géneros</option>
        {genres.map((g) => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>

      {/* Type */}
      <select
        value={params.typeId || ''}
        onChange={(e) => update({ typeId: e.target.value || undefined })}
        className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-red-500"
      >
        <option value="">Todos los tipos</option>
        {types.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      {/* Year */}
      <input
        type="number"
        value={params.releaseYear || ''}
        onChange={(e) => update({ releaseYear: e.target.value ? Number(e.target.value) : undefined })}
        placeholder="Año"
        min={1888}
        max={2100}
        className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 w-24 outline-none focus:border-red-500 placeholder-gray-500"
      />

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} /> Limpiar
        </button>
      )}
    </div>
  );
}
