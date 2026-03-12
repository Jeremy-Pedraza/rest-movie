import { Link } from 'react-router-dom';
import { Play, Star } from 'lucide-react';
import type { CatalogItem } from '../../types';

interface MediaCardProps {
  item: CatalogItem;
  dockMode?: boolean;
  cardRef?: (el: HTMLDivElement | null) => void;
  overlayRef?: (el: HTMLDivElement | null) => void;
}

export default function MediaCard({ item, dockMode = false, cardRef, overlayRef }: MediaCardProps) {
  const inner = (
    <>
      {/* Cover */}
      <div className="aspect-[2/3] bg-gray-700 relative overflow-hidden">
        {item.coverImage ? (
          <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <Star size={32} />
          </div>
        )}

        {/* Play overlay */}
        {dockMode ? (
          <div
            ref={overlayRef}
            className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200"
            style={{ opacity: 0, pointerEvents: 'none' }}
          >
            <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg shadow-red-600/30">
              <Play size={26} className="ml-0.5 text-white" />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
              <Play size={24} className="ml-0.5 text-white" />
            </div>
          </div>
        )}

        {item.genre && (
          <span className="absolute top-2 left-2 bg-red-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
            {item.genre.name}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <h3 className="text-sm font-semibold text-white truncate leading-tight">{item.title}</h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
          <span>{item.releaseYear}</span>
          {item.type && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span>{item.type.name}</span>
            </>
          )}
        </div>
      </div>
    </>
  );

  if (dockMode) {
    return (
      <div
        ref={cardRef}
        className="flex-shrink-0 w-44 sm:w-48 rounded-lg overflow-hidden bg-gray-800 shadow-lg origin-bottom"
        style={{ transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease' }}
      >
        <Link to={`/catalog/${item.id}`} className="block">
          {inner}
        </Link>
      </div>
    );
  }

  return (
    <Link
      to={`/catalog/${item.id}`}
      className="group/card relative flex-shrink-0 w-44 sm:w-48 rounded-lg overflow-hidden bg-gray-800 shadow-lg hover:scale-105 hover:z-10 hover:shadow-2xl transition-transform duration-200"
    >
      {inner}
    </Link>
  );
}
