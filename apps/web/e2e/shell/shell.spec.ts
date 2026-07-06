import { test, expect, type BrowserContext } from "@playwright/test";
import { loginViaApi, getSessionCookie } from "../helpers";

const API = "http://localhost:3001/v1";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@acme.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Test1234!";
const VIEWER_EMAIL = `e2e-viewer-${Date.now()}@acme.com`;
const VIEWER_PASSWORD = "ViewerTest1234!";

async function createViewerUser(adminCookie: string): Promise<void> {
  const inviteRes = await fetch(`${API}/auth/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ email: VIEWER_EMAIL, name: "E2E Viewer", role: "HR_VIEWER" }),
  });
  if (!inviteRes.ok) throw new Error(`invite failed: ${inviteRes.status}`);

  const { inviteToken } = (await inviteRes.json()) as { inviteToken: string };

  const setupRes = await fetch(`${API}/auth/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: inviteToken, name: "E2E Viewer", password: VIEWER_PASSWORD }),
  });
  if (!setupRes.ok) throw new Error(`setup failed: ${setupRes.status}`);
}

async function deleteUser(email: string, adminCookie: string): Promise<void> {
  // Best-effort cleanup — no hard failure if endpoint not available
  await fetch(`${API}/auth/users?email=${encodeURIComponent(email)}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  }).catch(() => undefined);
}

// AS15: ADMIN — all sidebar sections visible, each nav item navigates
test.describe("AS15: shell — ADMIN sidebar navigation", () => {
  test.beforeEach(async ({ context }) => {
    await loginViaApi(context, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("sidebar shows all sections and nav items for ADMIN", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.getByTestId("app-sidebar");
    await expect(sidebar).toBeVisible();

    // All sections
    await expect(sidebar.getByText("Overview")).toBeVisible();
    await expect(sidebar.getByText("Workforce")).toBeVisible();
    await expect(sidebar.getByText("Payroll", { exact: true })).toBeVisible();
    await expect(sidebar.getByText("Reporting")).toBeVisible();
    await expect(sidebar.getByText("Admin")).toBeVisible();

    // All nav items
    await expect(sidebar.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Employees" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Bulk Operations" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Run Payroll" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "History" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Reports" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Export" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Audit Log" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "User Management" })).toBeVisible();
  });

  test("clicking Employees navigates to /employees", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("app-sidebar").getByRole("link", { name: "Employees" }).click();
    await expect(page).toHaveURL(/\/employees/);
  });

  test("clicking Reports navigates to /reporting", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("app-sidebar").getByRole("link", { name: "Reports" }).click();
    await expect(page).toHaveURL(/\/reporting/);
  });
});

// AS16: HR_VIEWER — Admin section absent from sidebar DOM
test.describe("AS16: shell — HR_VIEWER sidebar", () => {
  let adminCookie: string;

  test.beforeAll(async ({ browser }) => {
    const ctx: BrowserContext = await browser.newContext();
    await loginViaApi(ctx, ADMIN_EMAIL, ADMIN_PASSWORD);
    adminCookie = await getSessionCookie(ctx);
    await createViewerUser(adminCookie);
    await ctx.close();
  });

  test.afterAll(async () => {
    await deleteUser(VIEWER_EMAIL, adminCookie);
  });

  test.beforeEach(async ({ context }) => {
    await loginViaApi(context, VIEWER_EMAIL, VIEWER_PASSWORD);
  });

  test("Admin section is absent from sidebar DOM for HR_VIEWER", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.getByTestId("app-sidebar");
    await expect(sidebar).toBeVisible();

    // Admin section and its items must not be in the DOM at all
    await expect(sidebar.getByText("Admin")).not.toBeAttached();
    await expect(sidebar.getByRole("link", { name: "Audit Log" })).not.toBeAttached();
    await expect(sidebar.getByRole("link", { name: "User Management" })).not.toBeAttached();

    // Unrestricted items still visible
    await expect(sidebar.getByRole("link", { name: "Employees" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Reports" })).toBeVisible();
  });
});

// AS17: Sidebar collapse — collapses to icon rail, preference survives reload
test.describe("AS17: shell — sidebar collapse", () => {
  test.beforeEach(async ({ context }) => {
    await loginViaApi(context, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("collapse toggle shrinks sidebar and hides text labels", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.getByTestId("app-sidebar");
    await expect(sidebar).toBeVisible();

    // Expanded: text labels visible
    await expect(sidebar.getByText("Employees")).toBeVisible();

    // Collapse
    await page.getByRole("button", { name: /collapse sidebar/i }).click();

    // Labels hidden, sidebar narrower
    await expect(sidebar.getByText("Employees")).not.toBeVisible();
    await expect(page.getByRole("button", { name: /expand sidebar/i })).toBeVisible();
  });

  test("collapse preference survives page reload", async ({ page }) => {
    await page.goto("/");

    // Collapse
    await page.getByRole("button", { name: /collapse sidebar/i }).click();
    await expect(page.getByRole("button", { name: /expand sidebar/i })).toBeVisible();

    // Reload
    await page.reload();
    await expect(page.getByTestId("app-sidebar")).toBeVisible();

    // Still collapsed after reload
    await expect(page.getByRole("button", { name: /expand sidebar/i })).toBeVisible();
    await expect(
      page.getByTestId("app-sidebar").getByText("Employees"),
    ).not.toBeVisible();
  });
});

// AS18: Mobile viewport — sidebar drawer
test.describe("AS18: shell — mobile sidebar drawer", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ context }) => {
    await loginViaApi(context, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("sidebar is closed by default on mobile", async ({ page }) => {
    await page.goto("/");
    // Desktop sidebar is hidden; drawer not open
    await expect(page.getByTestId("mobile-drawer")).not.toBeVisible();
    await expect(page.getByRole("button", { name: /open navigation/i })).toBeVisible();
  });

  test("hamburger opens the drawer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /open navigation/i }).click();
    await expect(page.getByTestId("mobile-drawer")).toBeVisible();
    await expect(
      page.getByTestId("mobile-drawer").getByRole("link", { name: "Employees" }),
    ).toBeVisible();
  });

  test("clicking overlay closes the drawer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /open navigation/i }).click();
    await expect(page.getByTestId("mobile-drawer")).toBeVisible();

    // Click the overlay (SheetOverlay is the backdrop behind the drawer)
    await page.mouse.click(350, 400); // right side of viewport, outside drawer
    await expect(page.getByTestId("mobile-drawer")).not.toBeVisible();
  });
});
