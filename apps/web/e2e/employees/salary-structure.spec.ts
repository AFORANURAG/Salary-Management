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
      effectiveFrom: "2024-01-01",
      currency: "USD",
      components: [
        { code: "BASIC", kind: "EARNING", amountMinor: 500_000 },
        { code: "PF", kind: "DEDUCTION", amountMinor: 60_000 },
      ],
    });

    try {
      await page.goto(`/employees/${emp.id}`);

      await expect(page.getByText("BASIC")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("PF")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("2024-01-01")).toBeVisible({ timeout: 5000 });
    } finally {
      await deleteEmployee(emp.id);
    }
  });

  test("SF10b: submitting the upsert dialog updates the card", async ({ page }) => {
    const emp = await createEmployee();
    await setSalaryStructure(emp.id, {
      effectiveFrom: "2024-01-01",
      currency: "USD",
      components: [{ code: "BASIC", kind: "EARNING", amountMinor: 500_000 }],
    });

    try {
      await page.goto(`/employees/${emp.id}`);
      await expect(page.getByText("BASIC")).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: /set salary structure/i }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 3000 });

      await dialog.getByLabel(/effective from/i).fill("2025-01-01");
      await dialog.getByRole("combobox", { name: /currency/i }).click();
      await page.getByRole("option", { name: "USD" }).click();

      await dialog.getByLabel(/code/i).fill("NEWCOMP");
      await dialog.getByLabel(/amount/i).fill("900000");

      await dialog.getByRole("button", { name: /save/i }).click();

      await expect(dialog).not.toBeVisible({ timeout: 5000 });
      await expect(page.getByText("NEWCOMP")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("2025-01-01")).toBeVisible({ timeout: 5000 });
    } finally {
      await deleteEmployee(emp.id);
    }
  });

  test("SF10c: history section shows previously set versions after an update", async ({ page }) => {
    const emp = await createEmployee();
    await setSalaryStructure(emp.id, {
      effectiveFrom: "2024-01-01",
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

      // Both dates visible (history starts expanded)
      await expect(page.getByText("2024-01-01")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("2025-01-01")).toBeVisible({ timeout: 5000 });
      // Prior version should be closed
      await expect(page.getByText("2024-12-31")).toBeVisible({ timeout: 5000 });
    } finally {
      await deleteEmployee(emp.id);
    }
  });
});
