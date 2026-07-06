import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildEmployeeInput } from "../utils/employee-factory";
import { persistActiveAdmin, persistHrUser } from "../utils/hr-user-factory";
import { createTestApp } from "../utils/test-app";

describe("Auth (e2e)", () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    app = await createTestApp();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // POST /v1/auth/invite
  // ---------------------------------------------------------------------------

  describe("POST /v1/auth/invite", () => {
    it("ADMIN can invite a new HR user and receives an invite token", async () => {
      const admin = await persistActiveAdmin();
      const loginRes = await http
        .post("/v1/auth/login")
        .send({ email: admin.email, password: "Test1234!" });
      const cookie = loginRes.headers["set-cookie"] as unknown as string[];

      const res = await http
        .post("/v1/auth/invite")
        .set("Cookie", cookie)
        .send({ email: "newhr@acme-test.example.com", name: "New HR", role: "HR_MANAGER" });

      expect(res.status).toBe(201);
      expect(res.body.inviteToken).toBeTruthy();
      expect(res.body.inviteUrl).toContain(res.body.inviteToken);
    });

    it("returns 403 when called by HR_MANAGER", async () => {
      const bcrypt = await import("bcrypt");
      const hash = await bcrypt.hash("Test1234!", 1);
      const manager = await persistHrUser({
        email: "manager@acme-test.example.com",
        role: "HR_MANAGER",
        passwordHash: hash,
        status: "ACTIVE",
      });

      const loginRes = await http
        .post("/v1/auth/login")
        .send({ email: manager.email, password: "Test1234!" });
      const cookie = loginRes.headers["set-cookie"] as unknown as string[];

      const res = await http
        .post("/v1/auth/invite")
        .set("Cookie", cookie)
        .send({ email: "another@acme-test.example.com", name: "Another", role: "HR_VIEWER" });

      expect(res.status).toBe(403);
    });

    it("ADMIN inviting twice produces two distinct usable tokens", async () => {
      const admin = await persistActiveAdmin({ email: "admin2@acme-test.example.com" });
      const loginRes = await http
        .post("/v1/auth/login")
        .send({ email: admin.email, password: "Test1234!" });
      const cookie = loginRes.headers["set-cookie"] as unknown as string[];

      const r1 = await http
        .post("/v1/auth/invite")
        .set("Cookie", cookie)
        .send({ email: "inv1@acme-test.example.com", name: "Inv1", role: "HR_VIEWER" });
      const r2 = await http
        .post("/v1/auth/invite")
        .set("Cookie", cookie)
        .send({ email: "inv2@acme-test.example.com", name: "Inv2", role: "HR_VIEWER" });

      expect(r1.status).toBe(201);
      expect(r2.status).toBe(201);
      expect(r1.body.inviteToken).not.toBe(r2.body.inviteToken);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /v1/auth/setup
  // ---------------------------------------------------------------------------

  describe("POST /v1/auth/setup", () => {
    it("activates account, returns 201, and allows login after", async () => {
      const admin = await persistActiveAdmin({ email: "admin3@acme-test.example.com" });
      const loginRes = await http
        .post("/v1/auth/login")
        .send({ email: admin.email, password: "Test1234!" });
      const cookie = loginRes.headers["set-cookie"] as unknown as string[];

      const inviteRes = await http
        .post("/v1/auth/invite")
        .set("Cookie", cookie)
        .send({ email: "setup-user@acme-test.example.com", name: "Setup User", role: "HR_VIEWER" });
      const { inviteToken } = inviteRes.body as { inviteToken: string };

      const setupRes = await http
        .post("/v1/auth/setup")
        .send({ token: inviteToken, name: "Setup User", password: "NewPass1!" });
      expect(setupRes.status).toBe(201);

      const loginAfter = await http
        .post("/v1/auth/login")
        .send({ email: "setup-user@acme-test.example.com", password: "NewPass1!" });
      expect(loginAfter.status).toBe(200);
      expect(loginAfter.headers["set-cookie"]).toBeDefined();
    });

    it("returns 410 for an expired invite token", async () => {
      const past = new Date(Date.now() - 1000);
      const expiredToken = "11111111-1111-4111-8111-111111111111";
      await persistHrUser({
        email: "expired@acme-test.example.com",
        inviteToken: expiredToken,
        inviteExpiresAt: past,
        status: "PENDING_SETUP",
      });

      const res = await http
        .post("/v1/auth/setup")
        .send({ token: expiredToken, name: "X", password: "Pass1234!" });
      expect(res.status).toBe(410);
    });

    it("returns 410 for an unknown token", async () => {
      const res = await http
        .post("/v1/auth/setup")
        .send({ token: "00000000-0000-0000-0000-000000000000", name: "X", password: "Pass1234!" });
      expect(res.status).toBe(410);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /v1/auth/login
  // ---------------------------------------------------------------------------

  describe("POST /v1/auth/login", () => {
    it("sets HttpOnly cookie on valid credentials", async () => {
      const admin = await persistActiveAdmin({ email: "login-test@acme-test.example.com" });
      const res = await http
        .post("/v1/auth/login")
        .send({ email: admin.email, password: "Test1234!" });

      expect(res.status).toBe(200);
      const setCookie = res.headers["set-cookie"] as unknown as string[];
      expect(setCookie).toBeDefined();
      expect(setCookie.some((c: string) => c.includes("hrms_session"))).toBe(true);
      expect(setCookie.some((c: string) => c.includes("HttpOnly"))).toBe(true);
    });

    it("returns 401 for wrong password", async () => {
      const admin = await persistActiveAdmin({ email: "wrong-pass@acme-test.example.com" });
      const res = await http
        .post("/v1/auth/login")
        .send({ email: admin.email, password: "wrongPassword!" });
      expect(res.status).toBe(401);
    });

    it("returns 401 for PENDING_SETUP account", async () => {
      const pendingUser = await persistHrUser({
        email: "pending@acme-test.example.com",
        status: "PENDING_SETUP",
      });
      void pendingUser;
      const res = await http
        .post("/v1/auth/login")
        .send({ email: "pending@acme-test.example.com", password: "anything" });
      expect(res.status).toBe(401);
    });

    it("returns 401 for unknown email", async () => {
      const res = await http
        .post("/v1/auth/login")
        .send({ email: "nobody@acme-test.example.com", password: "anything" });
      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /v1/auth/me
  // ---------------------------------------------------------------------------

  describe("GET /v1/auth/me", () => {
    it("returns current user for a valid cookie", async () => {
      const admin = await persistActiveAdmin({ email: "me-test@acme-test.example.com" });
      const loginRes = await http
        .post("/v1/auth/login")
        .send({ email: admin.email, password: "Test1234!" });
      const cookie = loginRes.headers["set-cookie"] as unknown as string[];

      const res = await http.get("/v1/auth/me").set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(admin.email);
      expect(res.body.role).toBe("ADMIN");
      expect(res.body.passwordHash).toBeUndefined();
    });

    it("returns 401 without a cookie", async () => {
      const res = await http.get("/v1/auth/me");
      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /v1/auth/logout
  // ---------------------------------------------------------------------------

  describe("POST /v1/auth/logout", () => {
    it("clears the cookie — server clears Set-Cookie on logout response", async () => {
      const admin = await persistActiveAdmin({ email: "logout-test@acme-test.example.com" });
      const loginRes = await http
        .post("/v1/auth/login")
        .send({ email: admin.email, password: "Test1234!" });
      const cookie = loginRes.headers["set-cookie"] as unknown as string[];

      const logoutRes = await http.post("/v1/auth/logout").set("Cookie", cookie);
      expect(logoutRes.status).toBe(200);
      // Server must send a Set-Cookie that clears hrms_session
      const setCookie = logoutRes.headers["set-cookie"] as unknown as string[];
      expect(setCookie.some((c: string) => c.includes("hrms_session") && c.includes("Expires="))).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Role guards on existing endpoints
  // ---------------------------------------------------------------------------

  describe("Role guards", () => {
    it("HR_VIEWER calling POST /v1/employees returns 403", async () => {
      const bcrypt = await import("bcrypt");
      const hash = await bcrypt.hash("Test1234!", 1);
      const viewer = await persistHrUser({
        email: "viewer@acme-test.example.com",
        role: "HR_VIEWER",
        passwordHash: hash,
        status: "ACTIVE",
      });
      const loginRes = await http
        .post("/v1/auth/login")
        .send({ email: viewer.email, password: "Test1234!" });
      const cookie = loginRes.headers["set-cookie"] as unknown as string[];

      const res = await http
        .post("/v1/employees")
        .set("Cookie", cookie)
        .send(buildEmployeeInput());
      expect(res.status).toBe(403);
    });

    it("unauthenticated request to /v1/employees returns 401", async () => {
      const res = await http.get("/v1/employees");
      expect(res.status).toBe(401);
    });

    it("GET /health is public — returns 200 without cookie", async () => {
      const res = await http.get("/health");
      expect(res.status).toBe(200);
    });
  });
});
