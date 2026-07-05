import { test, expect } from "@playwright/test";
import { createEmployee, deleteEmployee } from "../helpers";

const API = "http://localhost:3001/v1";

async function setSalaryStructure(
  employeeId: string,
  currency = "USD",
): Promise<void> {
  const res = await fetch(`${API}/employees/${employeeId}/salary-structure`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      effectiveFrom: "2024-01-01",
      currency,
      components: [
        { code: "BASIC", kind: "EARNING", amountMinor: 600_000 },
        { code: "PF", kind: "DEDUCTION", amountMinor: 72_000 },
      ],
    }),
  });
  if (!res.ok) throw new Error(`setSalaryStructure failed: ${res.status}`);
}

async function runPayroll(period: string): Promise<void> {
  const res = await fetch(`${API}/payroll/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ period }),
  });
  if (!res.ok && res.status !== 409) {
    throw new Error(`runPayroll failed: ${res.status} ${await res.text()}`);
  }
}

function uniquePeriod(base: number): string {
  const ts = Date.now();
  const year = base + (ts % 999);
  const month = String((Math.floor(ts / 1000) % 12) + 1).padStart(2, "0");
  return `${year}-${month}`;
}

test.describe("Reporting", () => {
  test("RF9: /reporting page loads and shows summary card and cost table for a payroll period", async ({
    page,
  }) => {
    const emp = await createEmployee({ department: "Engineering" });
    await setSalaryStructure(emp.id, "USD");
    const period = uniquePeriod(7000);
    await runPayroll(period);

    try {
      await page.goto("/reporting");
      // Set period in the month input
      await page.getByLabel("Period").fill(period);
      await page.waitForLoadState("networkidle");

      // Summary section heading is visible
      await expect(page.getByRole("heading", { name: "Summary" })).toBeVisible({
        timeout: 15_000,
      });

      // Summary card shows currency
      await expect(page.getByText("USD").first()).toBeVisible({
        timeout: 15_000,
      });

      // Cost breakdown table heading is visible
      await expect(
        page.getByRole("heading", { name: "Cost Breakdown" }),
      ).toBeVisible({ timeout: 10_000 });

      // Cost table shows the department row
      await expect(page.getByText("Engineering")).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await deleteEmployee(emp.id);
    }
  });

  test("RF10: selecting a different groupBy dimension updates the cost table rows", async ({
    page,
  }) => {
    const ts = Date.now();
    const year = 7500 + (ts % 499);
    const month = String((Math.floor(ts / 1000) % 12) + 1).padStart(2, "0");
    const period = `${year}-${month}`;

    const empA = await createEmployee({ department: "Finance" });
    const empB = await createEmployee({ department: "Finance" });
    await setSalaryStructure(empA.id, "USD");
    await setSalaryStructure(empB.id, "USD");
    await runPayroll(period);

    try {
      await page.goto("/reporting");
      await page.getByLabel("Period").fill(period);

      // Default groupBy=department: Finance row should appear
      await expect(page.getByText("Finance")).toBeVisible({ timeout: 15_000 });

      // Switch groupBy to Country
      await page.getByLabel("Group by").selectOption("country");

      // Country column header now visible; department rows gone
      await expect(page.getByRole("columnheader", { name: /country/i })).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await deleteEmployee(empA.id);
      await deleteEmployee(empB.id);
    }
  });

  test("RF11: cost table shows empty state when no payroll run exists for the entered period", async ({
    page,
  }) => {
    await page.goto("/reporting");

    // Use a period far in the future that has never had a payroll run
    await page.getByLabel("Period").fill("2099-12");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByText("No results for this period."),
    ).toBeVisible({ timeout: 15_000 });
  });
});
