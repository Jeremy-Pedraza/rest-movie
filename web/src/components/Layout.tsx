import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import alert from '../services/alert';
import {
  Film,
  Users,
  Tag,
  Clapperboard,
  Factory,
  Shield,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/media', label: 'Media', icon: Film },
  { to: '/directors', label: 'Directores', icon: Clapperboard },
  { to: '/genres', label: 'Géneros', icon: Tag },
  { to: '/producers', label: 'Productoras', icon: Factory },
  { to: '/types', label: 'Tipos', icon: Users },
  { to: '/roles', label: 'Roles', icon: Shield },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    const result = await alert.confirmLogout();
    if (!result.isConfirmed) return;
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Film size={24} /> REST API
          </h1>
        </div>
        <nav className="p-2 flex-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-colors ${
                location.pathname === to
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <div className="text-sm text-gray-400 mb-2 truncate">
            {user?.email}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors w-full"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm border-b px-4 py-3 flex items-center lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="ml-3 text-lg font-semibold">REST API</h1>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
