import type { PaginationMeta } from './response.utils.js';

export interface PaginationInput {
  page: number;
  limit: number;
  total: number;
}

export function parsePaginationQuery(
  query: Record<string, unknown>,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {},
): { page: number; limit: number; offset: number } {
  const defaultPage = defaults.page ?? 1;
  const defaultLimit = defaults.limit ?? 20;
  const maxLimit = defaults.maxLimit ?? 100;

  const page = Math.max(1, Number(query.page ?? defaultPage) || defaultPage);
  const rawLimit = Number(query.limit ?? defaultLimit) || defaultLimit;
  const limit = Math.min(maxLimit, Math.max(1, rawLimit));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function buildPaginationMeta(input: PaginationInput): PaginationMeta {
  const totalPages = input.total === 0 ? 0 : Math.ceil(input.total / input.limit);

  return {
    page: input.page,
    limit: input.limit,
    total: input.total,
    totalPages,
    hasNext: input.page < totalPages,
    hasPrev: input.page > 1,
  };
}
