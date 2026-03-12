import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCatalog } from '../../hooks/useCatalog';
import { catalogService } from '../../services/catalog.service';
import MediaCard from '../../components/catalog/MediaCard';
import FilterBar from '../../components/catalog/FilterBar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Genre, MediaType, CatalogParams } from '../../types';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [types, setTypes] = useState<MediaType[]>([]);

  // Build initial params from URL
  const initialParams: CatalogParams = {
    page: Number(searchParams.get('page')) || 1,
    limit: 20,
    search: searchParams.get('search') || undefined,
    genreId: searchParams.get('genreId') || undefined,
    typeId: searchParams.get('typeId') || undefined,
    releaseYear: searchParams.get('releaseYear') ? Number(searchParams.get('releaseYear')) : undefined,
  };

  const { items, meta, loading, params, setParams } = useCatalog(initialParams);

  // Load filter options
  useEffect(() => {
    Promise.allSettled([catalogService.getGenres(), catalogService.getTypes()]).then(([g, t]) => {
      if (g.status === 'fulfilled') setGenres(g.value.data.data);
      if (t.status === 'fulfilled') setTypes(t.value.data.data);
    });
  }, []);

  // Sync params to URL
  useEffect(() => {
    const sp = new URLSearchParams();
    if (params.page && params.page > 1) sp.set('page', String(params.page));
    if (params.search) sp.set('search', params.search);
    if (params.genreId) sp.set('genreId', params.genreId);
    if (params.typeId) sp.set('typeId', params.typeId);
    if (params.releaseYear) sp.set('releaseYear', String(params.releaseYear));
    setSearchParams(sp, { replace: true });
  }, [params, setSearchParams]);

  return (
    <div className="pt-24 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">Catálogo</h1>

      {/* Filters */}
      <div className="mb-8">
        <FilterBar params={params} genres={genres} types={types} onParamsChange={setParams} />
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-600 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No se encontraron resultados</p>
          <p className="text-sm mt-1">Intenta con otros filtros o términos de búsqueda</p>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {items.map((item) => (
              <div key={item.id} className="flex justify-center">
                <MediaCard item={item} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                disabled={!meta.hasPrevPage}
                onClick={() => setParams({ ...params, page: (params.page || 1) - 1 })}
                className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - meta.page) <= 2)
                .reduce<(number | string)[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`dot-${i}`} className="px-2 text-gray-500">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setParams({ ...params, page: p as number })}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        p === meta.page
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}

              <button
                disabled={!meta.hasNextPage}
                onClick={() => setParams({ ...params, page: (params.page || 1) + 1 })}
                className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>

              <span className="text-gray-500 text-sm ml-3">
                {meta.total} resultado{meta.total !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
