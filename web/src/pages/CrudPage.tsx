import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useCrud } from '../hooks/useCrud';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';
import alert from '../services/alert';
import type { CrudPageProps } from '../types';

export default function CrudPage({ title, service, columns, FormComponent, defaultValues = {} }: CrudPageProps) {
  const { items, meta, loading, params, setParams, create, update, remove } = useCrud(service);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleSearch = (search: string) => {
    setParams((prev) => ({ ...prev, search, page: 1 }));
  };

  const handleCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (item: Record<string, unknown>) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    setFormLoading(true);
    try {
      if (editing) {
        await update(editing.id as number, data);
      } else {
        await create(data);
      }
      setModalOpen(false);
    } catch {
      // El interceptor global ya maneja el error
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (item: Record<string, unknown>) => {
    const result = await alert.confirmDelete();
    if (!result.isConfirmed) return;

    try {
      await remove(item.id as number);
    } catch {
      // El interceptor global ya maneja el error
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> Crear nuevo
        </button>
      </div>

      <div className="mb-4">
        <SearchBar onSearch={handleSearch} placeholder={`Buscar ${title.toLowerCase()}...`} />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No se encontraron registros</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {columns.map((col) => (
                    <th key={col.key} className="text-left px-4 py-3 font-medium text-gray-600">
                      {col.label}
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id as number} className="border-b last:border-0 hover:bg-gray-50">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        {col.render ? col.render(item) : (item[col.key] as string)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta && (
        <Pagination
          meta={meta}
          onPageChange={(page) => setParams((prev) => ({ ...prev, page }))}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Editar ${title}` : `Crear ${title}`}
      >
        <FormComponent
          initialData={editing || defaultValues}
          onSubmit={handleSubmit}
          loading={formLoading}
          isEditing={!!editing}
        />
      </Modal>
    </div>
  );
}
