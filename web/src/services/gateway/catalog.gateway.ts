const BASE = '/catalog';

export const CATALOG_GATEWAY = {
  GET: {
    LIST: BASE,
    FEATURED: `${BASE}/featured`,
    BY_ID: (id: string) => `${BASE}/${id}`,
    GENRES: `${BASE}/genres`,
    TYPES: `${BASE}/types`,
  },
} as const;
