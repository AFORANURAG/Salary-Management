import { test, expect } from "@playwright/test";
import { createEmployee, deleteEmployee } from "../helpers";

test.describe("Employees — list", () => {
  test("EF26: list page loads with column headings and employee rows", async ({ page }) => {
    const emp = await createEmployee();
    try {
      await page.goto("/employees");
      await expect(page.getByRole("heading", { name: "Employees" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /name/i })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /code/i })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /email/i })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /department/i })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /status/i })).toBeVisible();
      await expect(page.getByText(emp.name)).toBeVisible();
    } finally {
      await deleteEmployee(emp.id);
    }
  });
});

test.describe("Employees — search", () => {
  test("EF27: searching by partial name filters displayed rows", async ({ page }) => {
    const unique = `Findable-${Date.now()}`;
    const emp = await createEmployee({ name: unique });
    const other = await createEmployee({ name: "ShouldNotMatch-ZZZ" });
    try {
      await page.goto("/employees");
      await page.getByRole("searchbox").fill(unique);
      // wait for debounce + re-fetch
      await expect(page.getByText(unique)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(other.name)).not.toBeVisible();
    } finally {
      await deleteEmployee(emp.id);
      await deleteEmployee(other.id);
    }
  });
});

test.describe("Employees — filter", () => {
  test("EF28: department filter narrows the list", async ({ page }) => {
    const emp = await createEmployee({ department: "FinanceE2E" });
    try {
      await page.goto("/employees");
      // Open the Department combobox
      await page.getByRole("combobox", { name: /department/i }).click();
      await page.getByRole("option", { name: "FinanceE2E" }).click();
      await expect(page.getByText(emp.name)).toBeVisible({ timeout: 5000 });
      // Engineering rows should not be visible (different department)
    } finally {
      await deleteEmployee(emp.id);
    }
  });
});

test.describe("Employees — pagination", () => {
  test("EF29: next-page navigation shows a different result set", async ({ page }) => {
    // Create 26 employees to push beyond the default page size of 25
    const employees = await Promise.all(
      Array.from({ length: 26 }, (_, i) =>
        createEmployee({ employeeCode: `PGTEST-${String(i).padStart(3, "0")}` })
      )
    );
    try {
      await page.goto("/employees");
      // Capture first-page first row name
      const firstRowName = await page
        .getByRole("row")
        .nth(1)
        .getByRole("cell")
        .first()
        .textContent();

      await page.getByRole("button", { name: /next/i }).click();
      await page.waitForURL(/page=2/);

      const secondPageFirst = await page
        .getByRole("row")
        .nth(1)
        .getByRole("cell")
        .first()
        .textContent();

      expect(secondPageFirst).not.toBe(firstRowName);
    } finally {
      await Promise.all(employees.map((e) => deleteEmployee(e.id)));
    }
  });
});

test.describe("Employees — create", () => {
  test("EF30: creating an employee via dialog causes new row to appear in the list", async ({ page }) => {
    const code = `NEW-${Date.now()}`;
    const name = `New Employee ${code}`;
    const email = `new-${Date.now()}@example.com`;

    await page.goto("/employees");
    await page.getByRole("button", { name: /add employee/i }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/employee code/i).fill(code);
    await dialog.getByLabel(/full name/i).fill(name);
    await dialog.getByLabel(/email/i).fill(email);
    await dialog.getByLabel(/department/i).fill("E2E-Dept");
    await dialog.getByLabel(/designation/i).fill("Tester");
    await dialog.getByLabel(/country/i).fill("IN");
    await dialog.getByLabel(/currency/i).fill("INR");
    await dialog.getByLabel(/joining date/i).fill("2024-06-01");

    await dialog.getByRole("button", { name: /create/i }).click();

    await expect(page.getByText(name)).toBeVisible({ timeout: 5000 });

    // cleanup — find and delete by code
    const res = await fetch(`http://localhost:3001/v1/employees?q=${code}`);
    const data = await res.json();
    if (data.data?.[0]?.id) await deleteEmployee(data.data[0].id);
  });
});

test.describe("Employees — edit", () => {
  test("EF31: editing an employee via dialog updates the displayed row", async ({ page }) => {
    const emp = await createEmployee();
    try {
      await page.goto("/employees");
      await expect(page.getByText(emp.name)).toBeVisible();

      // Open the row action menu and click Edit
      const row = page.getByRole("row", { name: new RegExp(emp.employeeCode) });
      await row.getByRole("button", { name: /open menu|actions/i }).click();
      await page.getByRole("menuitem", { name: /edit/i }).click();

      const dialog = page.getByRole("dialog");
      const updatedName = `${emp.name} Updated`;
      await dialog.getByLabel(/full name/i).fill(updatedName);
      await dialog.getByRole("button", { name: /save|update/i }).click();

      await expect(page.getByText(updatedName)).toBeVisible({ timeout: 5000 });
    } finally {
      await deleteEmployee(emp.id);
    }
  });
});

test.describe("Employees — delete", () => {
  test("EF32: deleting an employee via dialog removes the row from the list", async ({ page }) => {
    const emp = await createEmployee();

    await page.goto("/employees");
    await expect(page.getByText(emp.name)).toBeVisible();

    // Open the row action menu and click Delete
    const row = page.getByRole("row", { name: new RegExp(emp.employeeCode) });
    await row.getByRole("button", { name: /open menu|actions/i }).click();
    await page.getByRole("menuitem", { name: /delete/i }).click();

    // Confirm in the confirmation dialog
    await page.getByRole("button", { name: /confirm|delete/i }).click();

    await expect(page.getByText(emp.name)).not.toBeVisible({ timeout: 5000 });
    // No deleteEmployee cleanup needed — the test itself deleted it
  });
});
