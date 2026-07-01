export interface ErrorLike {
  message?: string | null;
  status?: number | null;
  code?: string | null;
  details?: unknown;
}
