export interface CrudGateway {
  GET: {
    LIST: string;
    BY_ID: (id: number | string) => string;
  };
  POST: {
    CREATE: string;
  };
  PUT: {
    UPDATE: (id: number | string) => string;
  };
  DELETE: {
    REMOVE: (id: number | string) => string;
  };
}

export function createCrudGateway(base: string): CrudGateway {
  return {
    GET: {
      LIST: base,
      BY_ID: (id: number | string) => `${base}/${id}`,
    },
    POST: {
      CREATE: base,
    },
    PUT: {
      UPDATE: (id: number | string) => `${base}/${id}`,
    },
    DELETE: {
      REMOVE: (id: number | string) => `${base}/${id}`,
    },
  };
}
