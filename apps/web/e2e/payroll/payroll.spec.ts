import { test, expect } from "@playwright/test";
import { createEmployee, deleteEmployee, loginViaApi, getSessionCookie } from "../helpers";

const API = "http://localhost:3001/v1";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@acme.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Test1234!";

async function runPayroll(period: string, cookieHeader: string): Promise<void> {
  const res = await fetch(`${API}/payroll/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({ period }),
  });
  if (!res.ok && res.status !== 409) {
    throw new Error(`runPayroll failed: ${res.status} ${await res.text()}`);
  }
}

async function setSalaryStructure(employeeId: string, cookieHeader: string): Promise<void> {
  const res = await fetch(`${API}/employees/${employeeId}/salary-structure`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({
      effectiveFrom: "2024-01-01",
      currency: "USD",
      components: [
        { code: "BASIC", kind: "EARNING", amountMinor: 500_000 },
        { code: "PF", kind: "DEDUCTION", amountMinor: 60_000 },
      ],
    }),
  });
  if (!res.ok) throw new Error(`setSalaryStructure failed: ${res.status}`);
}

test.describe("Payroll — hub", () => {
  test.beforeEach(async ({ context }) => {
    await loginViaApi(context, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("PF01: /payroll page loads and shows Run Payroll button", async ({ page }) => {
    await page.goto("/payroll");
    await expect(page.getByRole("heading", { name: "Payroll" })).toBeVisible();
    await expect(page.getByRole("button", { name: /run payroll/i })).toBeVisible();
  });

  test("PF02: triggering a run via dialog produces a success entry in the list", async ({ page, context }) => {
    const cookieHeader = await getSessionCookie(context);
    const emp = await createEmployee(cookieHeader);
    await setSalaryStructure(emp.id, cookieHeader);
    // Derive unique period from ms timestamp so each test run uses a fresh period
    const ts = Date.now();
    const year = 6000 + (ts % 3999);
    const month = String((Math.floor(ts / 1000) % 12) + 1).padStart(2, "0");
    const period = `${year}-${month}`;

    try {
      await page.goto("/payroll");
      // Wait for React hydration: "Loading…" disappears once usePayrollRuns query resolves
      await expect(page.getByText("Loading…")).not.toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: /run payroll/i }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await dialog.getByLabel(/pay period/i).fill(period);
      await dialog.getByRole("button", { name: /run payroll/i }).click();

      await expect(dialog).not.toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(period)).toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteEmployee(emp.id, cookieHeader);
    }
  });

  test("PF03: attempting to re-run the same period shows a 409 conflict message", async ({ page, context }) => {
    const cookieHeader = await getSessionCookie(context);
    const emp = await createEmployee(cookieHeader);
    await setSalaryStructure(emp.id, cookieHeader);
    const period = "2096-06";
    await runPayroll(period, cookieHeader);

    try {
      await page.goto("/payroll");
      await expect(page.getByText("Loading…")).not.toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: /run payroll/i }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await dialog.getByLabel(/pay period/i).fill(period);
      await dialog.getByRole("button", { name: /run payroll/i }).click();

      await expect(page.getByRole("alert")).toContainText(/already been run/i, { timeout: 10_000 });
    } finally {
      await deleteEmployee(emp.id, cookieHeader);
    }
  });
});

test.describe("Payroll — detail", () => {
  test.beforeEach(async ({ context }) => {
    await loginViaApi(context, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("PF04: /payroll/[period] shows correct summary and results rows", async ({ page, context }) => {
    const cookieHeader = await getSessionCookie(context);
    const emp = await createEmployee(cookieHeader);
    await setSalaryStructure(emp.id, cookieHeader);
    // Derive unique period from ms timestamp so each test run uses a fresh period
    const ts = Date.now();
    const year = 5000 + (ts % 4999);
    const month = String((Math.floor(ts / 1000) % 12) + 1).padStart(2, "0");
    const period = `${year}-${month}`;
    await runPayroll(period, cookieHeader);

    try {
      await page.goto(`/payroll/${period}`);
      await page.waitForLoadState("networkidle");

      // PayrollSummaryCard stat labels (updated shape: Headcount replaces Processed)
      await expect(page.getByText("Headcount", { exact: true })).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("status-badge-completed")).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(emp.id)).toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteEmployee(emp.id, cookieHeader);
    }
  });
});

// ---------------------------------------------------------------------------
// PO30 — Payroll ops E2E
// ---------------------------------------------------------------------------

async function createHrManagerUser(adminCookieHeader: string): Promise<{ email: string; password: string }> {
  const ts = Date.now();
  const email = `e2e-mgr-${ts}@acme-test.example.com`;
  const password = "Test1234!";

  const res = await fetch(`${API}/auth/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookieHeader },
    body: JSON.stringify({ email, name: "E2E Manager", role: "HR_MANAGER", password }),
  });
  if (!res.ok) {
    throw new Error(`createHrManagerUser failed: ${res.status} ${await res.text()}`);
  }
  return { email, password };
}


test.describe("Payroll — ops (PO30)", () => {
  test.beforeEach(async ({ context }) => {
    await loginViaApi(context, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("PO30a: history page loads with seeded runs showing status badges", async ({ page, context }) => {
    const cookieHeader = await getSessionCookie(context);
    const emp = await createEmployee(cookieHeader);
    await setSalaryStructure(emp.id, cookieHeader);
    const ts = Date.now();
    const year = 4000 + (ts % 999);
    const month = String((Math.floor(ts / 1000) % 12) + 1).padStart(2, "0");
    const period = `${year}-${month}`;
    await runPayroll(period, cookieHeader);

    try {
      await page.goto("/payroll");
      await expect(page.getByText("Loading…")).not.toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(period)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId(`status-badge-completed`)).toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteEmployee(emp.id, cookieHeader);
    }
  });

  test("PO30b: ADMIN can void a COMPLETED run — status badge updates to VOIDED", async ({ page, context }) => {
    const cookieHeader = await getSessionCookie(context);
    const emp = await createEmployee(cookieHeader);
    await setSalaryStructure(emp.id, cookieHeader);
    const ts = Date.now();
    const year = 3000 + (ts % 999);
    const month = String((Math.floor(ts / 1000) % 12) + 1).padStart(2, "0");
    const period = `${year}-${month}`;
    await runPayroll(period, cookieHeader);

    try {
      await page.goto(`/payroll/${period}`);
      await page.waitForLoadState("networkidle");

      await expect(page.getByTestId("status-badge-completed")).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole("button", { name: /void run/i })).toBeVisible();

      await page.getByRole("button", { name: /void run/i }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await dialog.getByRole("button", { name: /^void run$/i }).click();

      await expect(dialog).not.toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("status-badge-voided")).toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteEmployee(emp.id, cookieHeader);
    }
  });

  test("PO30c: HR_MANAGER does not see void button on detail page", async ({ context, browser }) => {
    // Set up: ADMIN creates a run
    const adminCookie = await getSessionCookie(context);
    const emp = await createEmployee(adminCookie);
    await setSalaryStructure(emp.id, adminCookie);
    const ts = Date.now();
    const year = 2900 + (ts % 99);
    const month = String((Math.floor(ts / 1000) % 12) + 1).padStart(2, "0");
    const period = `${year}-${month}`;
    await runPayroll(period, adminCookie);

    // Create HR_MANAGER user and login in a fresh context
    const mgr = await createHrManagerUser(adminCookie);
    const mgrContext = await browser.newContext();
    await loginViaApi(mgrContext, mgr.email, mgr.password);

    try {
      const mgrPage = await mgrContext.newPage();
      await mgrPage.goto(`/payroll/${period}`);
      await mgrPage.waitForLoadState("networkidle");
      await expect(mgrPage.getByTestId("status-badge-completed")).toBeVisible({ timeout: 15_000 });
      await expect(mgrPage.getByRole("button", { name: /void run/i })).not.toBeVisible();
    } finally {
      await mgrContext.close();
      await deleteEmployee(emp.id, adminCookie);
    }
  });

  test("PO30d: diff drawer opens from history row and renders salary changes", async ({ page, context }) => {
    const cookieHeader = await getSessionCookie(context);

    // Need two runs to diff: base and compareTo
    const emp = await createEmployee(cookieHeader);
    await setSalaryStructure(emp.id, cookieHeader);
    const ts = Date.now();
    const baseYear = 2800 + (ts % 99);
    const comparePeriod = `${baseYear}-01`;
    const basePeriod = `${baseYear}-02`;
    await runPayroll(comparePeriod, cookieHeader);
    await runPayroll(basePeriod, cookieHeader);

    try {
      await page.goto("/payroll");
      await expect(page.getByText("Loading…")).not.toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(basePeriod)).toBeVisible({ timeout: 10_000 });

      // Click the diff icon button on the base period row
      await page.getByTestId(`diff-btn-${basePeriod}`).click();

      // Drawer should open and show totals tile
      await expect(page.getByTestId("diff-totals")).toBeVisible({ timeout: 15_000 });
    } finally {
      await deleteEmployee(emp.id, cookieHeader);
    }
  });

  test("PO30e: diff drawer opens from detail page Compare button", async ({ page, context }) => {
    const cookieHeader = await getSessionCookie(context);
    const emp = await createEmployee(cookieHeader);
    await setSalaryStructure(emp.id, cookieHeader);
    const ts = Date.now();
    const baseYear = 2700 + (ts % 99);
    const comparePeriod = `${baseYear}-03`;
    const basePeriod = `${baseYear}-04`;
    await runPayroll(comparePeriod, cookieHeader);
    await runPayroll(basePeriod, cookieHeader);

    try {
      await page.goto(`/payroll/${basePeriod}`);
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("button", { name: /compare with previous/i })).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: /compare with previous/i }).click();

      await expect(page.getByTestId("diff-totals")).toBeVisible({ timeout: 15_000 });
    } finally {
      await deleteEmployee(emp.id, cookieHeader);
    }
  });
});
