import { useState, type ChangeEvent, type FormEvent } from 'react';
import CrudPage from './CrudPage';
import { typesService } from '../services/crud.service';
import type { Column, FormComponentProps } from '../types';

const columns: Column[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'description', label: 'Descripción', render: (item) => (item.description as string) || '-' },
  {
    key: 'createdAt',
    label: 'Creado',
    render: (item) => new Date(item.createdAt as string).toLocaleDateString('es'),
  },
];

function TypeForm({ initialData, onSubmit, loading }: FormComponentProps) {
  const [form, setForm] = useState({
    name: (initialData?.name as string) || '',
    description: (initialData?.description as string) || '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={(e: FormEvent) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input name="name" value={form.name} onChange={handleChange} required minLength={3} maxLength={100} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Descripción</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
}

export default function TypesPage() {
  return <CrudPage title="Tipos" service={typesService} columns={columns} FormComponent={TypeForm} />;
}
