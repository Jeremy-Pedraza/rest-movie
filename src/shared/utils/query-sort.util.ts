import { SortOrder } from '@shared/common';

export interface SortConfig {
  alias: string;
  defaultSortBy: string;
  allowedSortBy: Record<string, string>;
}

export function resolveOrderBy(
  sortBy: string | undefined,
  sortOrder: SortOrder | 'ASC' | 'DESC' | undefined,
  config: SortConfig,
): { column: string; direction: 'ASC' | 'DESC' } {
  const requestedSort = sortBy?.trim();
  const requestedDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

  const internalColumn =
    (requestedSort && config.allowedSortBy[requestedSort]) ||
    config.allowedSortBy[config.defaultSortBy];

  return {
    column: `${config.alias}.${internalColumn}`,
    direction: requestedDirection,
  };
}
