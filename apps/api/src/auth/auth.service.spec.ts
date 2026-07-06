import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Repository } from "typeorm";
import { UnauthorizedException } from "@nestjs/common";
import { HrUserEntity } from "../hr-users/hr-user.entity";

// These imports will fail until auth.service.ts is implemented (RED phase)
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type AuthServiceType = import("./auth.service").AuthService;

function makeRepo(overrides: Partial<Repository<HrUserEntity>> = {}): jest.Mocked<Repository<HrUserEntity>> {
  return {
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    ...overrides,
  } as unknown as jest.Mocked<Repository<HrUserEntity>>;
}

async function buildService(repoOverrides: Partial<Repository<HrUserEntity>> = {}): Promise<AuthServiceType> {
  const { AuthService } = await import("./auth.service");
  const { JwtService } = await import("@nestjs/jwt");
  const repo = makeRepo(repoOverrides);
  const jwtService = new JwtService({ secret: "test-secret", signOptions: { expiresIn: "8h" } });
  return new AuthService(repo as Repository<HrUserEntity>, jwtService);
}

describe("AuthService", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("invite()", () => {
    it("creates a PENDING_SETUP user with a non-null invite token expiring ~72h from now", async () => {
      const repo = makeRepo({
        findOne: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation((d) => d),
        save: vi.fn().mockImplementation(async (d) => ({ ...d, id: "uuid-1" })),
      });
      const svc = await buildService(repo);

      const result = await svc.invite(
        { email: "newhr@acme.com", name: "New HR", role: "HR_MANAGER" },
        { id: "admin-1", email: "admin@acme.com" },
      );

      expect(result.inviteToken).toBeTruthy();
      expect(result.inviteUrl).toContain(result.inviteToken);
      const saved = (repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as HrUserEntity;
      expect(saved.status).toBe("PENDING_SETUP");
      expect(saved.inviteToken).toBeTruthy();
      expect(saved.inviteExpiresAt).toBeDefined();
      const expiresIn = saved.inviteExpiresAt!.getTime() - Date.now();
      expect(expiresIn).toBeGreaterThan(71 * 60 * 60 * 1000);
      expect(expiresIn).toBeLessThan(73 * 60 * 60 * 1000);
    });

    it("throws 409 if the email is already taken", async () => {
      const existing = { id: "u1", email: "taken@acme.com" } as HrUserEntity;
      const repo = makeRepo({ findOne: vi.fn().mockResolvedValue(existing) });
      const svc = await buildService(repo);

      await expect(
        svc.invite({ email: "taken@acme.com", name: "X", role: "HR_VIEWER" }, { id: "a1", email: "admin@acme.com" }),
      ).rejects.toThrow();
    });
  });

  describe("setup()", () => {
    it("activates the user and sets passwordHash when token is valid", async () => {
      const future = new Date(Date.now() + 60 * 60 * 1000);
      const user = {
        id: "u1",
        status: "PENDING_SETUP",
        inviteToken: "valid-token",
        inviteExpiresAt: future,
        passwordHash: null,
      } as unknown as HrUserEntity;
      const repo = makeRepo({
        findOne: vi.fn().mockResolvedValue(user),
        save: vi.fn().mockImplementation(async (d) => d),
      });
      const svc = await buildService(repo);

      await svc.setup({ token: "valid-token", name: "Jane", password: "Password1!" });

      const saved = (repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as HrUserEntity;
      expect(saved.status).toBe("ACTIVE");
      expect(saved.passwordHash).toBeTruthy();
      expect(saved.inviteToken).toBeNull();
    });

    it("throws GoneException when the token is expired", async () => {
      const past = new Date(Date.now() - 1000);
      const user = {
        id: "u1",
        status: "PENDING_SETUP",
        inviteToken: "old-token",
        inviteExpiresAt: past,
      } as unknown as HrUserEntity;
      const repo = makeRepo({ findOne: vi.fn().mockResolvedValue(user) });
      const svc = await buildService(repo);

      await expect(
        svc.setup({ token: "old-token", name: "Jane", password: "Password1!" }),
      ).rejects.toThrow();
    });

    it("throws GoneException when the token does not exist", async () => {
      const repo = makeRepo({ findOne: vi.fn().mockResolvedValue(null) });
      const svc = await buildService(repo);

      await expect(
        svc.setup({ token: "no-such-token", name: "Jane", password: "Password1!" }),
      ).rejects.toThrow();
    });
  });

  describe("login()", () => {
    it("returns a JWT payload for valid credentials", async () => {
      const bcrypt = await import("bcrypt");
      const hash = await bcrypt.hash("correctPass1!", 1);
      const user = {
        id: "u1",
        email: "hr@acme.com",
        name: "HR User",
        role: "HR_MANAGER",
        status: "ACTIVE",
        passwordHash: hash,
      } as HrUserEntity;
      const repo = makeRepo({ findOne: vi.fn().mockResolvedValue(user) });
      const svc = await buildService(repo);

      const token = await svc.login({ email: "hr@acme.com", password: "correctPass1!" });
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("throws UnauthorizedException for wrong password", async () => {
      const bcrypt = await import("bcrypt");
      const hash = await bcrypt.hash("correctPass1!", 1);
      const user = {
        id: "u1",
        email: "hr@acme.com",
        status: "ACTIVE",
        passwordHash: hash,
      } as HrUserEntity;
      const repo = makeRepo({ findOne: vi.fn().mockResolvedValue(user) });
      const svc = await buildService(repo);

      await expect(
        svc.login({ email: "hr@acme.com", password: "wrongPass" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException for PENDING_SETUP account", async () => {
      const user = {
        id: "u1",
        email: "hr@acme.com",
        status: "PENDING_SETUP",
        passwordHash: null,
      } as HrUserEntity;
      const repo = makeRepo({ findOne: vi.fn().mockResolvedValue(user) });
      const svc = await buildService(repo);

      await expect(
        svc.login({ email: "hr@acme.com", password: "anything" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException for unknown email", async () => {
      const repo = makeRepo({ findOne: vi.fn().mockResolvedValue(null) });
      const svc = await buildService(repo);

      await expect(
        svc.login({ email: "nobody@acme.com", password: "anything" }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
