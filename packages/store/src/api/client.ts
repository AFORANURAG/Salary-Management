import { CORE_ERROR_MESSAGES, getRequestFailedMessage } from "@salary-mgmt/errors";

/**
 * Typed HTTP error returned by all API calls.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;

interface RequestOptions extends Omit<RequestInit, "signal"> {
  /** Override the default 15-second timeout (in milliseconds). */
  timeout?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getDetailArrayMessage(detail: unknown): string | null {
  if (!Array.isArray(detail)) return null;

  const messages = detail
    .map((entry) => {
      if (!isRecord(entry)) return null;
      return toNonEmptyString(entry.msg);
    })
    .filter((message): message is string => Boolean(message));

  if (messages.length === 0) return null;
  return messages.join(", ");
}

function parseErrorPayload(payload: unknown, status: number) {
  if (!isRecord(payload)) {
    return {
      message: getRequestFailedMessage(status),
      code: undefined as string | undefined,
      details: payload,
    };
  }

  const message =
    toNonEmptyString(payload.message) ??
    toNonEmptyString(payload.detail) ??
    getDetailArrayMessage(payload.detail) ??
    getRequestFailedMessage(status);

  return {
    message,
    code: toNonEmptyString(payload.code) ?? undefined,
    details: payload.detail,
  };
}

async function request<T>(baseUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT_MS, headers, ...init } = options;

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      credentials: "include",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    if (!response.ok) {
      let errorData: unknown = undefined;
      try {
        errorData = await response.json();
      } catch {
        // body may not be valid JSON — ignore parse failure
      }
      const parsedError = parseErrorPayload(errorData, response.status);
      throw new ApiError(
        parsedError.message,
        response.status,
        parsedError.code,
        parsedError.details
      );
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(CORE_ERROR_MESSAGES.REQUEST_TIMED_OUT, 408);
    }

    throw new ApiError(
      error instanceof Error ? error.message : CORE_ERROR_MESSAGES.NETWORK_ERROR,
      0
    );
  } finally {
    clearTimeout(timerId);
  }
}

/**
 * A minimal typed HTTP client.
 *
 * Usage:
 *   const api = createApiClient("http://localhost:8000");
 *   const data = await api.post<TokenResponse>("/api/v1/auth/login", { email, password });
 */
export function createApiClient(baseUrl: string) {
  return {
    get: <T>(path: string, options?: RequestOptions) =>
      request<T>(baseUrl, path, { ...options, method: "GET" }),

    post: <T>(path: string, body: unknown, options?: RequestOptions) =>
      request<T>(baseUrl, path, {
        ...options,
        method: "POST",
        body: JSON.stringify(body),
      }),

    patch: <T>(path: string, body: unknown, options?: RequestOptions) =>
      request<T>(baseUrl, path, {
        ...options,
        method: "PATCH",
        body: JSON.stringify(body),
      }),

    put: <T>(path: string, body: unknown, options?: RequestOptions) =>
      request<T>(baseUrl, path, {
        ...options,
        method: "PUT",
        body: JSON.stringify(body),
      }),

    delete: <T>(path: string, options?: RequestOptions) =>
      request<T>(baseUrl, path, { ...options, method: "DELETE" }),
  };
}
