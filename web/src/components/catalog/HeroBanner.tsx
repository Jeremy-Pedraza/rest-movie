import { Link } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import type { CatalogItem } from '../../types';

interface HeroBannerProps {
  item: CatalogItem | null;
}

export default function HeroBanner({ item }: HeroBannerProps) {
  if (!item) {
    return (
      <div className="relative h-[70vh] bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-600 text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
      {/* Background image */}
      {item.coverImage ? (
        <img
          src={item.coverImage}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gray-800" />
      )}

      {/* Overlay gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-gray-950/40" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="max-w-xl space-y-4">
            {item.type && (
              <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded">
                {item.type.name}
              </span>
            )}
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight drop-shadow-lg">
              {item.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <span>{item.releaseYear}</span>
              {item.genre && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-500" />
                  <span>{item.genre.name}</span>
                </>
              )}
              {item.director && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-500" />
                  <span>{item.director.names}</span>
                </>
              )}
            </div>
            {item.synopsis && (
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed line-clamp-3">
                {item.synopsis}
              </p>
            )}
            <div className="flex items-center gap-3 pt-2">
              <Link
                to={`/catalog/${item.id}`}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
              >
                <Play size={20} /> Ver ahora
              </Link>
              <Link
                to={`/catalog/${item.id}`}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium px-5 py-2.5 rounded-lg backdrop-blur-sm transition-colors"
              >
                <Info size={18} /> Más info
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
