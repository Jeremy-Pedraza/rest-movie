const BASE = '/users';

export const USERS_GATEWAY = {
  GET: {
    LIST: BASE,
  },
  PATCH: {
    APPROVE: (id: string) => `${BASE}/${id}/approve`,
    DEACTIVATE: (id: string) => `${BASE}/${id}/deactivate`,
  },
} as const;
