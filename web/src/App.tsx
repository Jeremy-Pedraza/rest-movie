import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import type { ReactNode } from 'react';

// Admin
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MediaPage from './pages/MediaPage';
import DirectorsPage from './pages/DirectorsPage';
import GenresPage from './pages/GenresPage';
import ProducersPage from './pages/ProducersPage';
import TypesPage from './pages/TypesPage';
import RolesPage from './pages/RolesPage';
import UsersPage from './pages/UsersPage';

// Catalog (público)
import CatalogLayout from './components/catalog/CatalogLayout';
import HomePage from './pages/catalog/HomePage';
import CatalogPage from './pages/catalog/CatalogPage';
import MediaDetailPage from './pages/catalog/MediaDetailPage';
import Login from './pages/Login';
import Register from './pages/Register';

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  const isAdmin = user.roles
    ? (user.roles as { name: string }[]).some((r) => r.name?.toLowerCase() === 'administrador')
    : false;

  if (!isAdmin) return <Navigate to="/" />;

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Rutas públicas con CatalogLayout */}
      <Route element={<CatalogLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/catalog/:id" element={<MediaDetailPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Rutas admin protegidas */}
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/media" element={<MediaPage />} />
                <Route path="/directors" element={<DirectorsPage />} />
                <Route path="/genres" element={<GenresPage />} />
                <Route path="/producers" element={<ProducersPage />} />
                <Route path="/types" element={<TypesPage />} />
                <Route path="/roles" element={<RolesPage />} />
                <Route path="/users" element={<UsersPage />} />
              </Routes>
            </Layout>
          </AdminRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
