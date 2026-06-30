import type { HealthResponse } from "@salary-mgmt/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`API health check failed: ${res.status}`);
  }

  return res.json() as Promise<HealthResponse>;
}
