export interface HealthResponse {
  readonly status: "ok";
  readonly timestamp: string;
}

export interface PaginatedResponse<T> {
  readonly data: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}
