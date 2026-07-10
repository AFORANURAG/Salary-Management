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

      // PayrollSummaryCard stat labels
      await expect(page.getByText("Headcount", { exact: true })).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("COMPLETED", { exact: true })).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(emp.id)).toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteEmployee(emp.id, cookieHeader);
    }
  });
});
