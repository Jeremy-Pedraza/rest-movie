import { useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MediaCard from './MediaCard';
import type { CatalogItem } from '../../types';

interface MediaSliderProps {
  title: string;
  items: CatalogItem[];
}

export default function MediaSlider({ title, items }: MediaSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const overlaysRef = useRef<HTMLDivElement[]>([]);
  const rafRef = useRef<number>(0);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  }, []);

  const applyDock = useCallback((clientX: number) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const dist = Math.abs(clientX - center);
        const maxDist = 200;
        const scale = dist < maxDist ? 1 + (1 - dist / maxDist) * 0.18 : 1;
        const isClosest = scale > 1.14;

        card.style.transform = `scale(${scale})`;
        card.style.zIndex = isClosest ? '10' : '1';
        card.style.boxShadow = isClosest
          ? '0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(220,38,38,0.15)'
          : '';

        const overlay = overlaysRef.current[i];
        if (overlay) {
          overlay.style.opacity = isClosest ? '1' : '0';
          overlay.style.pointerEvents = isClosest ? 'auto' : 'none';
        }
      });
    });
  }, []);

  const resetDock = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    cardsRef.current.forEach((card, i) => {
      if (!card) return;
      card.style.transform = 'scale(1)';
      card.style.zIndex = '1';
      card.style.boxShadow = '';

      const overlay = overlaysRef.current[i];
      if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
      }
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    applyDock(e.clientX);
  }, [applyDock]);

  if (!items.length) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-3 px-4 sm:px-6">{title}</h2>
      <div className="group/slider relative">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-12 z-20 w-12 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:from-black/95 hover:w-14"
        >
          <ChevronLeft size={30} className="text-white drop-shadow-lg" />
        </button>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 pb-2 items-end"
          style={{ minHeight: '310px', scrollBehavior: 'smooth' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={resetDock}
        >
          {items.map((item, index) => (
            <div key={item.id}>
              <MediaCard
                item={item}
                dockMode
                cardRef={(el: HTMLDivElement | null) => {
                  if (el) cardsRef.current[index] = el;
                }}
                overlayRef={(el: HTMLDivElement | null) => {
                  if (el) overlaysRef.current[index] = el;
                }}
              />
            </div>
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-12 z-20 w-12 bg-gradient-to-l from-black/80 via-black/40 to-transparent flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:from-black/95 hover:w-14"
        >
          <ChevronRight size={30} className="text-white drop-shadow-lg" />
        </button>
      </div>
    </section>
  );
}
