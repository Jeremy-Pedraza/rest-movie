import { useState, type ChangeEvent, type FormEvent } from 'react';
import CrudPage from './CrudPage';
import { directorsService } from '../services/crud.service';
import type { Column, FormComponentProps } from '../types';

const columns: Column[] = [
  { key: 'names', label: 'Nombre' },
  {
    key: 'isActive',
    label: 'Estado',
    render: (item) => (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {item.isActive ? 'Activo' : 'Inactivo'}
      </span>
    ),
  },
  {
    key: 'createdAt',
    label: 'Creado',
    render: (item) => new Date(item.createdAt as string).toLocaleDateString('es'),
  },
];

function DirectorForm({ initialData, onSubmit, loading, isEditing }: FormComponentProps) {
  const [form, setForm] = useState({
    names: (initialData?.names as string) || '',
    ...(isEditing ? { isActive: (initialData?.isActive as boolean) ?? true } : {}),
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  return (
    <form
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input
          name="names"
          value={form.names}
          onChange={handleChange}
          required
          minLength={3}
          maxLength={150}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      {isEditing && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive ?? true}
            onChange={handleChange}
            className="rounded"
          />
          Activo
        </label>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
}

export default function DirectorsPage() {
  return (
    <CrudPage
      title="Directores"
      service={directorsService}
      columns={columns}
      FormComponent={DirectorForm}
    />
  );
}
