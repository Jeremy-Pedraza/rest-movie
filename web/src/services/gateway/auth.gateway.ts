const BASE = '/auth';

export const AUTH_GATEWAY = {
  POST: {
    LOGIN: `${BASE}/login`,
    REGISTER: `${BASE}/register`,
    REFRESH: `${BASE}/refresh`,
  },
  GET: {
    PROFILE: `${BASE}/profile`,
  },
} as const;
