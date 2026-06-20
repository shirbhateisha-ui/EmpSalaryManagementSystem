import type { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  options: { status?: number; meta?: PaginationMeta } = {},
): Response {
  const body: ApiSuccessResponse<T> = { success: true, data };
  if (options.meta) {
    body.meta = options.meta;
  }
  return res.status(options.status ?? 200).json(body);
}

export function sendError(res: Response, error: ApiErrorBody, status = 500): Response {
  const body: ApiErrorResponse = { success: false, error };
  return res.status(status).json(body);
}
