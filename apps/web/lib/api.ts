import type { HealthResponse } from "@salary-mgmt/types";
import { createApiClient } from "@salary-mgmt/store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const api = createApiClient(API_BASE);

export async function fetchHealth(): Promise<HealthResponse> {
  return api.get<HealthResponse>("/health");
}
