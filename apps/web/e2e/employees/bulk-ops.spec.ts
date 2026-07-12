import * as fs from "fs";
import * as path from "path";
import { test, expect } from "@playwright/test";
import { createEmployee, deleteEmployee, loginViaApi, getSessionCookie } from "../helpers";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@acme.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Test1234!";

test.beforeEach(async ({ context }) => {
  await loginViaApi(context, ADMIN_EMAIL, ADMIN_PASSWORD);
});

test.describe("BO22 – bulk status change", () => {
  test("select 3 rows → toolbar appears → set Inactive → toast shown → rows updated", async ({
    page,
    context,
  }) => {
    const cookieHeader = await getSessionCookie(context);
    const prefix = `BLKST-${Date.now()}`;
    const employees = await Promise.all(
      Array.from({ length: 3 }, (_, i) =>
        createEmployee(cookieHeader, {
          employeeCode: `${prefix}-${i}`,
          name: `${prefix} Emp ${i}`,
        }),
      ),
    );

    try {
      await page.goto("/employees");

      // Search to isolate our 3 employees
      await page.getByRole("searchbox").fill(prefix);
      await expect(page.getByText(`${prefix} Emp 0`)).toBeVisible({ timeout: 8000 });

      // Select all 3 via header checkbox
      await page.getByRole("checkbox", { name: /select all/i }).click();

      // Toolbar appears
      await expect(page.getByTestId("bulk-action-toolbar")).toBeVisible({ timeout: 3000 });
      await expect(page.getByTestId("bulk-action-toolbar")).toContainText("3 selected");

      // Pick "Set Inactive"
      await page.getByTestId("bulk-action-toolbar").getByRole("button", { name: /change status/i }).click();
      await page.getByRole("menuitem", { name: /set inactive/i }).click();

      // Confirm
      await page.getByTestId("bulk-action-toolbar").getByRole("button", { name: /confirm/i }).click();

      // Toast shown
      await expect(page.getByText(/status updated/i)).toBeVisible({ timeout: 5000 });

      // Toolbar clears (selection reset)
      await expect(page.getByTestId("bulk-action-toolbar")).not.toBeVisible({ timeout: 5000 });

      // List refetches — employees should now show INACTIVE badge
      await expect(page.getByText(`${prefix} Emp 0`)).toBeVisible({ timeout: 5000 });
      const rows = page.getByRole("row").filter({ hasText: prefix });
      const inactiveBadges = rows.filter({ hasText: "INACTIVE" });
      await expect(inactiveBadges).toHaveCount(3, { timeout: 5000 });
    } finally {
      await Promise.all(employees.map((e) => deleteEmployee(e.id, cookieHeader)));
    }
  });
});

test.describe("BO22 – CSV import", () => {
  test("upload valid CSV → results show N imported, 0 failed → View Employees navigates", async ({
    page,
    context,
  }) => {
    const cookieHeader = await getSessionCookie(context);
    const uid = Date.now();
    const csvContent = [
      "employeeCode,name,email,department,designation,country,currency,joiningDate,employmentStatus",
      `IMP-${uid}-1,Import One ${uid},import1-${uid}@example.com,Engineering,Engineer,US,USD,2024-01-01,ACTIVE`,
      `IMP-${uid}-2,Import Two ${uid},import2-${uid}@example.com,Finance,Analyst,US,USD,2024-01-01,ACTIVE`,
    ].join("\n");

    const tmpFile = path.join("/tmp", `bulk-import-${uid}.csv`);
    fs.writeFileSync(tmpFile, csvContent);

    // Track created ids for cleanup
    const createdIds: string[] = [];

    try {
      await page.goto("/employees/bulk");
      await expect(page.getByTestId("drop-zone")).toBeVisible({ timeout: 5000 });

      // Upload the CSV
      const fileInput = page.getByLabel("Choose CSV file");
      await fileInput.setInputFiles(tmpFile);

      await expect(page.getByTestId("selected-file")).toBeVisible({ timeout: 2000 });
      await expect(page.getByTestId("preview-import-btn")).toBeEnabled();

      await page.getByTestId("preview-import-btn").click();

      // Results step
      await expect(page.getByTestId("results-step")).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId("results-step")).toContainText("2 employees imported");
      await expect(page.getByTestId("failure-table")).not.toBeVisible();

      // Collect created employee ids for cleanup
      const res = await fetch(
        `http://localhost:3001/v1/employees?q=Import+One+${uid}`,
        { headers: { Cookie: cookieHeader } },
      );
      const data = await res.json();
      for (const emp of data.data ?? []) createdIds.push(emp.id);

      const res2 = await fetch(
        `http://localhost:3001/v1/employees?q=Import+Two+${uid}`,
        { headers: { Cookie: cookieHeader } },
      );
      const data2 = await res2.json();
      for (const emp of data2.data ?? []) createdIds.push(emp.id);

      // View Employees button navigates
      await page.getByTestId("view-employees-btn").click();
      await expect(page).toHaveURL(/\/employees$/, { timeout: 5000 });
    } finally {
      fs.unlinkSync(tmpFile);
      await Promise.all(createdIds.map((id) => deleteEmployee(id, cookieHeader)));
    }
  });

  test("upload CSV with 2 invalid rows → failure table shows row numbers and errors", async ({
    page,
  }) => {
    const uid = Date.now();
    const csvContent = [
      "employeeCode,name,email,department,designation,country,currency,joiningDate,employmentStatus",
      // valid row
      `IMP-V-${uid},Valid Employee ${uid},valid-${uid}@example.com,Engineering,Engineer,US,USD,2024-01-01,ACTIVE`,
      // invalid: missing name + bad email
      `IMP-B1-${uid},,not-an-email,Engineering,Engineer,US,USD,2024-01-01,ACTIVE`,
      // invalid: duplicate employeeCode (same as valid row above — will be caught as duplicate or bad format)
      `IMP-B2-${uid},Another Person ${uid},another-${uid}@example.com,Engineering,Engineer,US,USD,not-a-date,ACTIVE`,
    ].join("\n");

    const tmpFile = path.join("/tmp", `bulk-import-bad-${uid}.csv`);
    fs.writeFileSync(tmpFile, csvContent);

    try {
      await page.goto("/employees/bulk");
      const fileInput = page.getByLabel("Choose CSV file");
      await fileInput.setInputFiles(tmpFile);

      await page.getByTestId("preview-import-btn").click();

      await expect(page.getByTestId("results-step")).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId("failure-table")).toBeVisible({ timeout: 3000 });

      // At least 2 failure rows (header + 2 data rows minimum)
      const rows = page.getByTestId("failure-table").getByRole("row");
      await expect(rows).toHaveCount(3, { timeout: 3000 }); // header + 2 failures
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  test("Download template link has correct href and download attribute", async ({ page }) => {
    await page.goto("/employees/bulk");
    await expect(page.getByTestId("drop-zone")).toBeVisible({ timeout: 5000 });

    const link = page.getByTestId("download-template");
    await expect(link).toHaveAttribute("href", "/templates/employees-import-template.csv");
    await expect(link).toHaveAttribute("download");
  });
});
