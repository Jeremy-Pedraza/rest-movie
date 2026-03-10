import { useState, useEffect, useCallback } from 'react';
import alert from '../services/alert';
import type { CrudService, CrudParams, PaginationMeta } from '../types';

export function useCrud(service: CrudService, defaultParams: CrudParams = {}) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<CrudParams>({ page: 1, limit: 10, ...defaultParams });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await service.getAll(params);
      const payload = res.data.data as unknown;
      if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
        const paginated = payload as { data: Record<string, unknown>[]; meta: PaginationMeta };
        setItems(paginated.data);
        setMeta(paginated.meta);
      } else if (Array.isArray(payload)) {
        setItems(payload);
        setMeta(null);
      }
    } catch {
      // El interceptor global de Axios ya muestra la alerta
    } finally {
      setLoading(false);
    }
  }, [service, params]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const create = async (data: Record<string, unknown>) => {
    const res = await service.create(data);
    alert.created();
    fetchItems();
    return res.data.data;
  };

  const update = async (id: number | string, data: Record<string, unknown>) => {
    const res = await service.update(id, data);
    alert.updated();
    fetchItems();
    return res.data.data;
  };

  const remove = async (id: number | string) => {
    await service.delete(id);
    alert.deleted();
    fetchItems();
  };

  return { items, meta, loading, params, setParams, fetchItems, create, update, remove };
}
