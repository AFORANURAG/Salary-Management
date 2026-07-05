import { test, expect } from "@playwright/test";
import { createEmployee, deleteEmployee } from "../helpers";

const API = "http://localhost:3001/v1";

async function setSalaryStructure(employeeId: string): Promise<void> {
  const res = await fetch(`${API}/employees/${employeeId}/salary-structure`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      effectiveFrom: "2024-01-01",
      currency: "USD",
      components: [
        { code: "BASIC", kind: "EARNING", amountMinor: 500_000 },
        { code: "HRA", kind: "EARNING", amountMinor: 100_000 },
        { code: "PF", kind: "DEDUCTION", amountMinor: 60_000 },
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

// Derive a unique period from a base year offset + timestamp so parallel runs don't collide.
function uniquePeriod(baseYear = 7000): string {
  const ts = Date.now();
  const year = baseYear + (ts % 999);
  const month = String((Math.floor(ts / 1000) % 12) + 1).padStart(2, "0");
  return `${year}-${month}`;
}

test.describe("Payslips — employee detail + detail page", () => {
  test("PS19: employee detail page shows payslip history list after a payroll run", async ({ page }) => {
    const emp = await createEmployee();
    await setSalaryStructure(emp.id);
    const period = uniquePeriod();
    await runPayroll(period);

    try {
      await page.goto(`/employees/${emp.id}`);
      await page.waitForLoadState("networkidle");

      await expect(page.getByText(period)).toBeVisible({ timeout: 15_000 });
    } finally {
      await deleteEmployee(emp.id);
    }
  });

  test("PS20: clicking a period row navigates to the payslip detail page and shows correct line items", async ({ page }) => {
    const emp = await createEmployee();
    await setSalaryStructure(emp.id);
    const period = uniquePeriod(8000);
    await runPayroll(period);

    try {
      await page.goto(`/employees/${emp.id}`);
      await page.waitForLoadState("networkidle");

      const periodLink = page.getByRole("link", { name: new RegExp(period) });
      await expect(periodLink).toBeVisible({ timeout: 15_000 });
      await periodLink.click();

      await expect(page).toHaveURL(new RegExp(`/employees/${emp.id}/payslips/${period}`));
      await expect(page.getByText("BASIC")).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText("HRA")).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText("PF")).toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteEmployee(emp.id);
    }
  });

  test("PS21: net pay on the payslip detail page matches the value shown in the history list row", async ({ page }) => {
    const emp = await createEmployee();
    await setSalaryStructure(emp.id);
    const period = uniquePeriod(9000);
    await runPayroll(period);

    try {
      await page.goto(`/employees/${emp.id}`);
      await page.waitForLoadState("networkidle");

      // Capture the net pay text from the history row
      const historyRow = page.getByRole("link", { name: new RegExp(period) });
      await expect(historyRow).toBeVisible({ timeout: 15_000 });
      const historyNetText = await historyRow.textContent();

      // Navigate to detail page
      await historyRow.click();
      await expect(page).toHaveURL(new RegExp(`/employees/${emp.id}/payslips/${period}`));

      // Net Pay label is present on the detail page
      const netPayRow = page.getByText("Net Pay");
      await expect(netPayRow).toBeVisible({ timeout: 10_000 });

      // The formatted net amount shown in the history row also appears on the detail page.
      // textContent() includes period + net amount; strip the period to isolate the amount.
      const netAmount = historyNetText?.replace(period, "").trim();
      expect(netAmount).toBeTruthy();
      await expect(page.getByText(netAmount!).first()).toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteEmployee(emp.id);
    }
  });
});
