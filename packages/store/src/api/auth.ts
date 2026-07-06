import type {
  AuthMeResponse,
  InviteRequest,
  InviteResponse,
  LoginRequest,
  SetupRequest,
} from "@salary-mgmt/types";
import { createApiClient } from "./client";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");

const api = createApiClient(API_BASE);

export function getMe(): Promise<AuthMeResponse> {
  return api.get<AuthMeResponse>("/v1/auth/me");
}

export function postLogin(body: LoginRequest): Promise<void> {
  return api.post<void>("/v1/auth/login", body);
}

export function postSetup(body: SetupRequest): Promise<void> {
  return api.post<void>("/v1/auth/setup", body);
}

export function postLogout(): Promise<void> {
  return api.post<void>("/v1/auth/logout", {});
}

export function postInvite(body: InviteRequest): Promise<InviteResponse> {
  return api.post<InviteResponse>("/v1/auth/invite", body);
}
