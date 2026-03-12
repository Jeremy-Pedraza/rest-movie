export const QUERY_SORT_CONFIGS = {
  director: {
    alias: 'director',
    defaultSortBy: 'createdAt',
    allowedSortBy: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      names: 'names',
      isActive: 'isActive',
    },
  },
  genre: {
    alias: 'genre',
    defaultSortBy: 'createdAt',
    allowedSortBy: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      name: 'name',
      isActive: 'isActive',
    },
  },
  logger: {
    alias: 'log',
    defaultSortBy: 'createdAt',
    allowedSortBy: {
      createdAt: 'createdAt',
      level: 'level',
      context: 'context',
      status_code: 'status_code',
      response_time: 'response_time',
    },
  },
  media: {
    alias: 'media',
    defaultSortBy: 'createdAt',
    allowedSortBy: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      title: 'title',
      serial: 'serial',
      releaseYear: 'releaseYear',
    },
  },
  catalog: {
    alias: 'media',
    defaultSortBy: 'createdAt',
    allowedSortBy: {
      createdAt: 'createdAt',
      title: 'title',
      releaseYear: 'releaseYear',
    },
  },
  producer: {
    alias: 'producer',
    defaultSortBy: 'createdAt',
    allowedSortBy: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      name: 'name',
      isActive: 'isActive',
    },
  },
  type: {
    alias: 'type',
    defaultSortBy: 'createdAt',
    allowedSortBy: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      name: 'name',
    },
  },
} as const;
