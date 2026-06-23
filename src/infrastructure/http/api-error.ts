export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    readonly correlationId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function parseApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) return new ApiError(error.message);
  return new ApiError('Erro na requisição');
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 404;
}
