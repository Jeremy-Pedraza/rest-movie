import { Outlet } from 'react-router-dom';
import CatalogNavbar from './CatalogNavbar';

export default function CatalogLayout() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <CatalogNavbar />
      <main>
        <Outlet />
      </main>
      <footer className="bg-black border-t border-gray-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} StreamApp. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
