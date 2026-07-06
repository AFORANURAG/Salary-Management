import { http, HttpResponse } from "msw";
import type { AuthMeResponse } from "@salary-mgmt/types";

const API_BASE = "http://localhost:3001";

export const mockAdminUser: AuthMeResponse = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  email: "admin@acme.com",
  name: "Admin User",
  role: "ADMIN",
};

export const mockViewerUser: AuthMeResponse = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  email: "viewer@acme.com",
  name: "Viewer User",
  role: "HR_VIEWER",
};

export const authHandlers = [
  http.get(`${API_BASE}/v1/auth/me`, () => {
    return HttpResponse.json(mockAdminUser);
  }),

  http.post(`${API_BASE}/v1/auth/login`, () => {
    return HttpResponse.json({}, { status: 200 });
  }),

  http.post(`${API_BASE}/v1/auth/logout`, () => {
    return HttpResponse.json({}, { status: 200 });
  }),
];

export const authHandlers401 = [
  http.get(`${API_BASE}/v1/auth/me`, () => {
    return new HttpResponse(null, { status: 401 });
  }),
];

export const authHandlersLoginFail = [
  http.post(`${API_BASE}/v1/auth/login`, () => {
    return HttpResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }),
];
