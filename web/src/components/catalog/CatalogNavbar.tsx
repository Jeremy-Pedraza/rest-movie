import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { catalogService } from '../../services/catalog.service';
import { Film, Search, User, LogOut, Shield, X, Play } from 'lucide-react';
import alert from '../../services/alert';
import type { CatalogItem } from '../../types';

export default function CatalogNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [results, setResults] = useState<CatalogItem[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchValue.trim() || searchValue.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await catalogService.getAll({ search: searchValue.trim(), limit: 6 });
        setResults(res.data.data.data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchValue]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchValue.trim())}`);
      closeSearch();
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchValue('');
    setResults([]);
  };

  const goToMedia = (id: string) => {
    navigate(`/catalog/${id}`);
    closeSearch();
  };

  const handleLogout = async () => {
    const result = await alert.confirmLogout();
    if (!result.isConfirmed) return;
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const isAdmin = user?.roles
    ? (user.roles as { name: string }[]).some((r) => r.name?.toLowerCase() === 'administrador')
    : false;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/95 shadow-lg backdrop-blur-sm' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-red-500 font-bold text-xl">
              <Film size={28} />
              <span className="hidden sm:inline">StreamApp</span>
            </Link>
            <div className="hidden sm:flex items-center gap-6">
              <Link to="/" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Inicio
              </Link>
              <Link to="/catalog" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Catálogo
              </Link>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Search */}
            {searchOpen ? (
              <div ref={dropdownRef} className="relative">
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="Buscar títulos..."
                      autoFocus
                      className="bg-black/70 border border-gray-600 text-white text-sm rounded px-3 py-1.5 w-48 sm:w-72 outline-none focus:border-red-500 placeholder-gray-500"
                    />
                    {searching && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={closeSearch}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </form>

                {/* Search results dropdown */}
                {(results.length > 0 || (searchValue.trim().length >= 2 && !searching)) && (
                  <div className="absolute top-full left-0 right-8 mt-2 bg-gray-900/98 border border-gray-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
                    {results.length > 0 ? (
                      <>
                        {results.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => goToMedia(item.id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/80 transition-colors text-left"
                          >
                            {/* Thumbnail */}
                            <div className="w-10 h-14 rounded overflow-hidden bg-gray-800 flex-shrink-0">
                              {item.coverImage ? (
                                <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                  <Play size={14} />
                                </div>
                              )}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{item.title}</p>
                              <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                                <span>{item.releaseYear}</span>
                                {item.genre && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                                    <span>{item.genre.name}</span>
                                  </>
                                )}
                                {item.type && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                                    <span>{item.type.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                        {/* View all results */}
                        <button
                          onClick={handleSearch as unknown as () => void}
                          className="w-full px-3 py-2.5 text-center text-sm text-red-500 hover:text-red-400 hover:bg-gray-800/50 border-t border-gray-800 transition-colors"
                        >
                          Ver todos los resultados
                        </button>
                      </>
                    ) : (
                      <div className="px-4 py-6 text-center text-gray-500 text-sm">
                        No se encontraron resultados
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="text-gray-300 hover:text-white p-1">
                <Search size={20} />
              </button>
            )}

            {/* Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-white text-sm font-bold">
                    {user.firstName?.charAt(0).toUpperCase()}
                  </div>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 py-2">
                      <div className="px-4 py-2 border-b border-gray-700">
                        <p className="text-white text-sm font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-gray-400 text-xs truncate">{user.email}</p>
                      </div>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                        >
                          <Shield size={16} /> Panel Admin
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white w-full text-left"
                      >
                        <LogOut size={16} /> Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-1.5 rounded transition-colors"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
