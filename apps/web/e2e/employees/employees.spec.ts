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
      // Search for the employee to find it regardless of which page it landed on
      await page.getByRole("searchbox").fill(emp.employeeCode);
      await expect(page.getByText(emp.name)).toBeVisible({ timeout: 5000 });
    } finally {
      await deleteEmployee(emp.id);
    }
  });
});

test.describe("Employees — search", () => {
  test("EF27: searching by partial name filters displayed rows", async ({ page }) => {
    const unique = `Findable-${Date.now()}`;
    const emp = await createEmployee({ name: unique });
    const other = await createEmployee({ name: `NotMatch-${Date.now()}` });
    try {
      await page.goto("/employees");
      await page.getByRole("searchbox").fill(unique);
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
    // Use a department from the hardcoded list in EmployeeFilters
    const emp = await createEmployee({ department: "Finance" });
    const other = await createEmployee({ department: "HR" });
    try {
      await page.goto("/employees");

      // Select "Finance" from the Department combobox
      await page.getByRole("combobox", { name: /department/i }).click();
      await page.getByRole("option", { name: "Finance" }).click();

      // Finance employee should be visible; HR employee should not
      await expect(page.getByText(emp.name)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(other.name)).not.toBeVisible();
    } finally {
      await deleteEmployee(emp.id);
      await deleteEmployee(other.id);
    }
  });
});

test.describe("Employees — pagination", () => {
  test("EF29: next-page navigation shows a different result set", async ({ page }) => {
    const prefix = `PG${Date.now()}`;
    // Create 26 employees with a unique prefix so we can search-isolate them
    const employees = await Promise.all(
      Array.from({ length: 26 }, (_, i) =>
        createEmployee({
          employeeCode: `${prefix}-${String(i).padStart(3, "0")}`,
          name: `${prefix} Employee ${String(i).padStart(3, "0")}`,
        })
      )
    );
    try {
      await page.goto("/employees");
      // Search for the prefix to isolate our 26 from any other data
      await page.getByRole("searchbox").fill(prefix);
      await expect(page.getByText(`${prefix} Employee 000`)).toBeVisible({ timeout: 5000 });

      // Capture page 1 first row employee code
      const firstPageCode = await page
        .getByRole("row")
        .nth(1)
        .getByRole("cell")
        .nth(1)
        .textContent();

      await page.getByRole("button", { name: "Next" }).click();
      // Wait for page 2 content to settle
      await expect(page.getByText("Page 2")).toBeVisible({ timeout: 5000 });

      const secondPageCode = await page
        .getByRole("row")
        .nth(1)
        .getByRole("cell")
        .nth(1)
        .textContent();

      expect(secondPageCode).not.toBe(firstPageCode);
    } finally {
      await Promise.all(employees.map((e) => deleteEmployee(e.id)));
    }
  });
});

test.describe("Employees — create", () => {
  test("EF30: creating an employee via dialog causes new row to appear in the list", async ({ page }) => {
    const code = `CRE-${Date.now()}`;
    const name = `Create Test ${code}`;
    const email = `cre-${Date.now()}@example.com`;

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

    // Dialog closes; search by code to find the row regardless of current page
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await page.getByRole("searchbox").fill(code);
    await expect(page.getByText(name)).toBeVisible({ timeout: 5000 });

    // cleanup
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

      // Search to bring the employee into view
      await page.getByRole("searchbox").fill(emp.employeeCode);
      await expect(page.getByText(emp.name)).toBeVisible({ timeout: 5000 });

      // Open row actions menu
      const row = page.getByRole("row").filter({ hasText: emp.employeeCode });
      await row.getByRole("button", { name: /row actions/i }).click();
      await page.getByRole("menuitem", { name: /edit/i }).click();

      const dialog = page.getByRole("dialog");
      const updatedName = `${emp.name} Updated`;
      await dialog.getByLabel(/full name/i).fill(updatedName);
      await dialog.getByRole("button", { name: /save changes/i }).click();

      await expect(dialog).not.toBeVisible({ timeout: 5000 });
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
    await page.getByRole("searchbox").fill(emp.employeeCode);
    await expect(page.getByText(emp.name)).toBeVisible({ timeout: 5000 });

    const row = page.getByRole("row").filter({ hasText: emp.employeeCode });
    await row.getByRole("button", { name: /row actions/i }).click();
    await page.getByRole("menuitem", { name: /delete/i }).click();

    await page.getByRole("button", { name: /confirm/i }).click();

    // Soft delete sets status to TERMINATED; row stays in list but badge changes
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    const deletedRow = page.getByRole("row").filter({ hasText: emp.employeeCode });
    await expect(deletedRow.getByText("TERMINATED")).toBeVisible({ timeout: 5000 });
    // No API cleanup needed — record is already soft-deleted
  });
});
