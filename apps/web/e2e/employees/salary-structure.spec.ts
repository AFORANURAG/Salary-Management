import { test, expect } from "@playwright/test";
import { createEmployee, deleteEmployee } from "../helpers";

const API = "http://localhost:3001/v1";

async function setSalaryStructure(
  employeeId: string,
  input: {
    effectiveFrom: string;
    currency: string;
    components: Array<{ code: string; kind: string; amountMinor: number }>;
  }
): Promise<void> {
  const res = await fetch(`${API}/employees/${employeeId}/salary-structure`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`setSalaryStructure failed: ${res.status} ${await res.text()}`);
  }
}

test.describe("Salary Structure — detail page", () => {
  test("SF10a: employee detail page shows active salary structure components", async ({ page }) => {
    const emp = await createEmployee();
    await setSalaryStructure(emp.id, {
      effectiveFrom: "2024-07-01",
      currency: "USD",
      components: [
        { code: "BASIC", kind: "EARNING", amountMinor: 500_000 },
        { code: "PF", kind: "DEDUCTION", amountMinor: 60_000 },
      ],
    });

    try {
      await page.goto(`/employees/${emp.id}`);
      await page.waitForLoadState("networkidle");

      // Use table cell locator to avoid ambiguity with history rows
      await expect(page.getByRole("cell", { name: "BASIC" })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole("cell", { name: "PF" })).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("2024-07-01").first()).toBeVisible({ timeout: 10000 });
    } finally {
      await deleteEmployee(emp.id);
    }
  });

  test("SF10b: submitting the upsert dialog updates the card", async ({ page }) => {
    const emp = await createEmployee();
    await setSalaryStructure(emp.id, {
      effectiveFrom: "2024-07-01",
      currency: "USD",
      components: [{ code: "BASIC", kind: "EARNING", amountMinor: 500_000 }],
    });

    try {
      await page.goto(`/employees/${emp.id}`);
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("cell", { name: "BASIC" })).toBeVisible({ timeout: 10000 });

      await page.getByRole("button", { name: /set salary structure/i }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });

      await dialog.getByLabel(/effective from/i).fill("2025-01-01");
      await dialog.getByRole("combobox", { name: /currency/i }).click();
      await page.getByRole("option", { name: "USD" }).click();

      await dialog.getByLabel(/code/i).fill("NEWCOMP");
      await dialog.getByLabel(/amount/i).fill("900000");

      await dialog.getByRole("button", { name: /save/i }).click();

      await expect(dialog).not.toBeVisible({ timeout: 5000 });
      await expect(page.getByRole("cell", { name: "NEWCOMP" })).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("2025-01-01").first()).toBeVisible({ timeout: 10000 });
    } finally {
      await deleteEmployee(emp.id);
    }
  });

  test("SF10c: history section shows previously set versions after an update", async ({ page }) => {
    const emp = await createEmployee();
    await setSalaryStructure(emp.id, {
      effectiveFrom: "2024-07-01",
      currency: "USD",
      components: [{ code: "BASIC", kind: "EARNING", amountMinor: 500_000 }],
    });
    await setSalaryStructure(emp.id, {
      effectiveFrom: "2025-01-01",
      currency: "USD",
      components: [{ code: "BASIC", kind: "EARNING", amountMinor: 600_000 }],
    });

    try {
      await page.goto(`/employees/${emp.id}`);
      await page.waitForLoadState("networkidle");

      // History starts expanded; both versions visible
      await expect(page.getByText("2024-07-01").first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("2025-01-01").first()).toBeVisible({ timeout: 10000 });
      // Prior version should be closed with effectiveTo = day before new effectiveFrom
      await expect(page.getByText("2024-12-31")).toBeVisible({ timeout: 10000 });
    } finally {
      await deleteEmployee(emp.id);
    }
  });
});
