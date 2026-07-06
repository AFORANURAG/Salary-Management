import type { BrowserContext, Page } from "@playwright/test";

const API = "http://localhost:3001/v1";

export interface EmployeeFixture {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  department: string;
}

function uid(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0")}`;
}

/**
 * Authenticate via the API directly (sets hrms_session cookie on the context).
 * Returns the cookie string value.
 */
export async function loginViaApi(
  context: BrowserContext,
  email: string,
  password: string,
): Promise<void> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`loginViaApi failed: ${res.status} ${await res.text()}`);
  }
  const rawCookie = res.headers.get("set-cookie");
  if (!rawCookie) throw new Error("loginViaApi: no Set-Cookie header");

  // Parse hrms_session value and add to Playwright context
  const match = rawCookie.match(/hrms_session=([^;]+)/);
  if (!match?.[1]) throw new Error("loginViaApi: hrms_session not found in cookie");

  await context.addCookies([
    {
      name: "hrms_session",
      value: match[1],
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
}

/**
 * Log in by filling the login form in the browser (full UI flow).
 */
export async function loginViaUI(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/auth/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

export async function createEmployee(
  cookieHeader: string,
  overrides: Partial<{
    employeeCode: string;
    name: string;
    email: string;
    department: string;
  }> = {},
): Promise<EmployeeFixture> {
  const id = uid();
  const body = {
    employeeCode: overrides.employeeCode ?? `E2E-${id}`,
    name: overrides.name ?? `E2E Employee ${id}`,
    email: overrides.email ?? `e2e-${id}@example.com`,
    department: overrides.department ?? "Engineering",
    designation: "Engineer",
    country: "IN",
    currency: "INR",
    joiningDate: "2024-01-01",
    employmentStatus: "ACTIVE",
  };

  const res = await fetch(`${API}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`createEmployee failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    employeeCode: data.employeeCode,
    name: data.name,
    email: data.email,
    department: data.department,
  };
}

export async function deleteEmployee(id: string, cookieHeader: string): Promise<void> {
  await fetch(`${API}/employees/${id}`, {
    method: "DELETE",
    headers: { Cookie: cookieHeader },
  });
}

/** Get hrms_session cookie string from Playwright context for API calls. */
export async function getSessionCookie(context: BrowserContext): Promise<string> {
  const cookies = await context.cookies();
  const session = cookies.find((c) => c.name === "hrms_session");
  if (!session) throw new Error("getSessionCookie: hrms_session not found");
  return `hrms_session=${session.value}`;
}
