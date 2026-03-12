import { useEffect, useState, useCallback } from 'react';
import { usersService } from '../services/users.service';
import alert from '../services/alert';
import { Search, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '../types';

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles: { id: string; name: string }[];
  createdAt: string;
}

type StatusFilter = 'all' | 'pending' | 'active';

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 10, search: search || undefined };
      if (statusFilter === 'pending') params.isActive = false;
      else if (statusFilter === 'active') params.isActive = true;

      const res = await usersService.getAll(params);
      const payload = res.data.data;
      setUsers((payload.data || []) as unknown as UserItem[]);
      setMeta((payload.meta || null) as PaginationMeta | null);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleApprove = async (id: string) => {
    const result = await alert.confirm({
      title: 'Aprobar usuario',
      text: 'El usuario podra iniciar sesion despues de ser aprobado.',
      icon: 'question',
      confirmButtonText: 'Aprobar',
    });
    if (!result.isConfirmed) return;
    try {
      await usersService.approve(id);
      alert.toastSuccess('Usuario aprobado');
      fetchUsers();
    } catch {
      // handled by interceptor
    }
  };

  const handleDeactivate = async (id: string) => {
    const result = await alert.confirm({
      title: 'Desactivar usuario',
      text: 'El usuario no podra iniciar sesion.',
      icon: 'warning',
      confirmButtonText: 'Desactivar',
    });
    if (!result.isConfirmed) return;
    try {
      await usersService.deactivate(id);
      alert.toastSuccess('Usuario desactivado');
      fetchUsers();
    } catch {
      // handled by interceptor
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gestión de Usuarios</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            Buscar
          </button>
        </form>
        <div className="flex gap-1">
          {(['pending', 'active', 'all'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'pending' ? 'Pendientes' : f === 'active' ? 'Activos' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No se encontraron usuarios</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Roles</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Registro</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.roles.map((r) => (
                        <span key={r.id} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded mr-1">
                          {r.name}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        u.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {u.isActive ? 'Activo' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('es')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {!u.isActive && (
                          <button
                            onClick={() => handleApprove(u.id)}
                            title="Aprobar"
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        {u.isActive && (
                          <button
                            onClick={() => handleDeactivate(u.id)}
                            title="Desactivar"
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
            <span className="text-gray-500">
              Página {meta.page} de {meta.totalPages} ({meta.total} usuarios)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!meta.hasPrevPage}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!meta.hasNextPage}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
