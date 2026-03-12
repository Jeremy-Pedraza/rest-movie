import { useState, useEffect, useCallback } from 'react';
import { catalogService } from '../services/catalog.service';
import type { CatalogItem, CatalogParams, PaginationMeta } from '../types';

export function useCatalog(defaultParams: CatalogParams = {}) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<CatalogParams>({ page: 1, limit: 20, ...defaultParams });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await catalogService.getAll(params);
      const payload = res.data.data;
      if (payload && 'data' in payload) {
        setItems(payload.data);
        setMeta(payload.meta);
      }
    } catch {
      // Interceptor global maneja el error
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, meta, loading, params, setParams };
}
