import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '../types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export default function Pagination({ meta, onPageChange }: PaginationProps) {
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <span className="text-gray-600">
        Mostrando {meta.limit * (meta.page - 1) + 1}-
        {Math.min(meta.limit * meta.page, meta.total)} de {meta.total}
      </span>
      <div className="flex gap-1">
        <button
          disabled={!meta.hasPrevPage}
          onClick={() => onPageChange(meta.page - 1)}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
          .filter(
            (p) =>
              p === 1 ||
              p === meta.totalPages ||
              Math.abs(p - meta.page) <= 1,
          )
          .reduce<(number | string)[]>((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '...' ? (
              <span key={`dot-${i}`} className="px-2 py-1">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`px-3 py-1 rounded ${
                  p === meta.page
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ),
          )}
        <button
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
