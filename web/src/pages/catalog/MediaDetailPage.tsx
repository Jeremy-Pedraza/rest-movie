import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { catalogService } from '../../services/catalog.service';
import { Play, ArrowLeft, Lock, Calendar, Clapperboard, Tag, Factory, Film, Star } from 'lucide-react';
import type { CatalogDetail } from '../../types';

function getYoutubeEmbedUrl(url?: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host === 'youtu.be') {
      const videoId = parsed.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host.includes('youtube.com')) {
      if (parsed.pathname === '/watch') {
        const videoId = parsed.searchParams.get('v');
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      if (parsed.pathname.startsWith('/embed/')) {
        return url;
      }

      if (parsed.pathname.startsWith('/shorts/')) {
        const videoId = parsed.pathname.split('/').filter(Boolean)[1];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export default function MediaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [media, setMedia] = useState<CatalogDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    catalogService
      .getById(id)
      .then((res) => setMedia(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-600 border-t-transparent" />
      </div>
    );
  }

  if (!media) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-400">
        <p className="text-lg">Contenido no encontrado</p>
        <Link to="/catalog" className="text-red-500 hover:text-red-400 flex items-center gap-1">
          <ArrowLeft size={16} /> Volver al catálogo
        </Link>
      </div>
    );
  }

  const youtubeEmbedUrl = getYoutubeEmbedUrl(media.url);

  return (
    <>
      {/* Hero backdrop */}
      <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
        {media.coverImage ? (
          <img src={media.coverImage} alt={media.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gray-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-gray-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-gray-950/50" />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-72 relative z-10">
        <Link to="/catalog" className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Volver al catálogo
        </Link>

        <div className="flex flex-col sm:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0 w-56 sm:w-64">
            <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl bg-gray-800">
              {media.coverImage ? (
                <img src={media.coverImage} alt={media.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <Play size={48} />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            {media.type && (
              <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded">
                {media.type.name}
              </span>
            )}

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">{media.title}</h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> {media.releaseYear}
              </span>
              {media.genre && (
                <span className="flex items-center gap-1.5">
                  <Tag size={14} /> {media.genre.name}
                </span>
              )}
              {media.director && (
                <span className="flex items-center gap-1.5">
                  <Clapperboard size={14} /> {media.director.names}
                </span>
              )}
              {media.producer && (
                <span className="flex items-center gap-1.5">
                  <Factory size={14} /> {media.producer.name}
                </span>
              )}
            </div>

            {media.serial && (
              <p className="text-xs text-gray-500 font-mono">{media.serial}</p>
            )}

            {/* Synopsis */}
            {media.synopsis && (
              <div>
                <h3 className="text-white font-semibold mb-2">Sinopsis</h3>
                <p className="text-gray-300 leading-relaxed">{media.synopsis}</p>
              </div>
            )}

          </div>
        </div>

        {/* Trailer Section - public, no login required */}
        {media.url && (
          <div className="mt-12">
            <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
              <Play size={20} /> Tráiler oficial
            </h2>
            {youtubeEmbedUrl ? (
              <div className="overflow-hidden rounded-xl bg-black shadow-2xl border border-gray-800">
                <div className="aspect-video">
                  <iframe
                    src={youtubeEmbedUrl}
                    title={`Tráiler de ${media.title}`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <a
                href={media.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors text-lg"
              >
                <Play size={22} /> Ver tráiler
              </a>
            )}
          </div>
        )}

        {/* Simulated Movie Player - requires login */}
        <div className="mt-10">
          <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
            <Film size={22} /> Película completa
          </h2>
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-gray-800 bg-black">
            {/* Cinematic background - Universal style */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a2e] via-[#0d1033] to-black">
              {/* Stars */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(60)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-white animate-pulse"
                    style={{
                      width: `${Math.random() * 2 + 1}px`,
                      height: `${Math.random() * 2 + 1}px`,
                      top: `${Math.random() * 60}%`,
                      left: `${Math.random() * 100}%`,
                      opacity: Math.random() * 0.7 + 0.3,
                      animationDelay: `${Math.random() * 3}s`,
                      animationDuration: `${Math.random() * 2 + 2}s`,
                    }}
                  />
                ))}
              </div>

              {/* Globe / Ring element */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  {/* Outer ring */}
                  <div className="w-44 h-44 sm:w-56 sm:h-56 md:w-72 md:h-72 rounded-full border-2 border-yellow-500/40 flex items-center justify-center">
                    {/* Inner ring orbit */}
                    <div className="absolute w-52 sm:w-64 md:w-80 h-16 sm:h-20 md:h-24 border border-yellow-500/30 rounded-[50%] -rotate-[20deg]" />
                    {/* Globe body */}
                    <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-blue-900/60 via-blue-800/40 to-transparent border border-blue-400/20 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-yellow-500/80 font-bold text-xs sm:text-sm md:text-base tracking-[0.3em] uppercase">
                          {media.producer?.name || 'Universal'}
                        </p>
                        <p className="text-yellow-500/50 text-[9px] sm:text-[10px] md:text-xs tracking-[0.2em] mt-1 uppercase">
                          Pictures
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Light beam from bottom */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/3 bg-gradient-to-t from-yellow-500/5 via-transparent to-transparent" />

              {/* Film grain overlay */}
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
              }} />
            </div>

            {/* Movie title overlay at top */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10">
              <p className="text-gray-400 text-xs font-mono">
                {media.serial || 'HD'} • {media.releaseYear} • {media.genre?.name}
              </p>
            </div>

            {/* Bottom bar - simulated player controls */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <div className="h-1 bg-gray-800">
                <div className="h-full w-0 bg-red-600 rounded-r" />
              </div>
              <div className="flex items-center justify-between px-4 py-2 bg-black/80 text-gray-500 text-xs">
                <span>0:00:00</span>
                <span className="flex items-center gap-1"><Star size={10} /> {media.title}</span>
                <span>2:14:30</span>
              </div>
            </div>

            {/* Login overlay - not authenticated */}
            {!user && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px]">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    <Lock size={36} className="text-white/80" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg sm:text-xl">Contenido exclusivo</p>
                    <p className="text-gray-400 text-sm mt-1">Inicia sesión para ver la película completa</p>
                  </div>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-lg transition-all hover:scale-105 shadow-lg shadow-red-600/25"
                  >
                    <Play size={20} /> Iniciar sesión para ver
                  </Link>
                  <p className="text-gray-600 text-xs">
                    ¿No tienes cuenta? <Link to="/register" className="text-red-500 hover:text-red-400">Regístrate gratis</Link>
                  </p>
                </div>
              </div>
            )}

            {/* Logged-in simulated play */}
            {user && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center cursor-pointer group">
                <div className="w-20 h-20 rounded-full bg-red-600/90 group-hover:bg-red-600 flex items-center justify-center transition-all group-hover:scale-110 shadow-lg shadow-red-600/30">
                  <Play size={36} className="text-white ml-1" />
                </div>
                <p className="text-white/70 text-sm mt-3 group-hover:text-white transition-colors">Reproducir película</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-16" />
    </>
  );
}
