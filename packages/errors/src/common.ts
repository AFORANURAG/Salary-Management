export const CORE_ERROR_MESSAGES = {
  REQUEST_TIMED_OUT: "Request timed out",
  NETWORK_ERROR: "Network error",
} as const;

export function getRequestFailedMessage(status: number): string {
  return `Request failed with status ${status}`;
}
