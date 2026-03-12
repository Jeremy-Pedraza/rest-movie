import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { catalogService } from '../../services/catalog.service';
import HeroBanner from '../../components/catalog/HeroBanner';
import MediaSlider from '../../components/catalog/MediaSlider';
import type { CatalogItem, Genre } from '../../types';

export default function HomePage() {
  const [featured, setFeatured] = useState<CatalogItem[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [byGenre, setByGenre] = useState<Record<string, CatalogItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [featuredRes, genresRes] = await Promise.all([
          catalogService.getFeatured(),
          catalogService.getGenres(),
        ]);

        const featuredData = featuredRes.data.data;
        const genresData = genresRes.data.data;

        setFeatured(featuredData);
        setGenres(genresData);

        // Fetch media per genre (first 5 genres)
        const genreSlice = genresData.slice(0, 5);
        const genreResults = await Promise.allSettled(
          genreSlice.map((g) =>
            catalogService.getAll({ genreId: String(g.id), limit: 15 }),
          ),
        );

        const grouped: Record<string, CatalogItem[]> = {};
        genreSlice.forEach((g, i) => {
          const result = genreResults[i];
          if (result.status === 'fulfilled') {
            const payload = result.value.data.data;
            if (payload && 'data' in payload) {
              grouped[g.name] = payload.data;
            }
          }
        });
        setByGenre(grouped);
      } catch {
        // Interceptor global
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-600 border-t-transparent" />
      </div>
    );
  }

  const heroItem = featured[0] || null;

  return (
    <>
      <HeroBanner item={heroItem} />

      <div className="max-w-7xl mx-auto -mt-20 relative z-10 space-y-2">
        {/* Featured slider */}
        {featured.length > 1 && (
          <MediaSlider title="Destacadas" items={featured} />
        )}

        {/* Per-genre sliders */}
        {Object.entries(byGenre).map(([genreName, items]) =>
          items.length > 0 ? (
            <MediaSlider key={genreName} title={genreName} items={items} />
          ) : null,
        )}

        {/* CTA */}
        <div className="text-center py-8">
          <Link
            to="/catalog"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Ver todo el catálogo
          </Link>
        </div>
      </div>
    </>
  );
}
