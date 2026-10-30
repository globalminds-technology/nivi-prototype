import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { AdminAuthService } from "./admin-auth.service";
import { UnauthorizedError } from "@/core/domain/errors/domain-errors";

// Mock env
vi.mock("@/infrastructure/config/env", () => ({
  env: () => ({
    ADMIN_EMAIL: "admin@test.com",
    ADMIN_PASSWORD_HASH: bcrypt.hashSync("secret123", 4),
    MANAGER_EMAIL: "manager@test.com",
    MANAGER_PASSWORD_HASH: bcrypt.hashSync("manager123", 4),
    AUTH_SECRET: "test-auth-secret-min-32-chars-long!",
  }),
}));

// Mock next/headers
let mockCookieStorage: Record<string, string> = {};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => (mockCookieStorage[name] ? { value: mockCookieStorage[name] } : undefined),
    set: (name: string, value: string) => {
      mockCookieStorage[name] = value;
    },
    delete: (name: string) => {
      delete mockCookieStorage[name];
    },
  })),
}));

describe("AdminAuthService", () => {
  beforeEach(() => {
    mockCookieStorage = {};
  });

  describe("verifyCredentials", () => {
    it("accepts correct admin credentials with hideZohoBooks=false", async () => {
      const user = await AdminAuthService.verifyCredentials("admin@test.com", "secret123");
      expect(user).not.toBeNull();
      expect(user?.email).toBe("admin@test.com");
      expect(user?.role).toBe("admin");
      expect(user?.hideZohoBooks).toBe(false);
    });

    it("accepts correct manager credentials with hideZohoBooks=true", async () => {
      const user = await AdminAuthService.verifyCredentials("manager@test.com", "manager123");
      expect(user).not.toBeNull();
      expect(user?.email).toBe("manager@test.com");
      expect(user?.role).toBe("manager");
      expect(user?.hideZohoBooks).toBe(true);
    });

    it("rejects wrong password", async () => {
      const user = await AdminAuthService.verifyCredentials("admin@test.com", "wrong-password");
      expect(user).toBeNull();
    });

    it("rejects wrong email", async () => {
      const user = await AdminAuthService.verifyCredentials("other@test.com", "secret123");
      expect(user).toBeNull();
    });
  });

  describe("session token handling", () => {
    it("creates and verifies a valid JWT session token for admin", async () => {
      const token = await AdminAuthService.createSessionToken("admin@test.com", "admin", false);
      expect(token).toBeDefined();

      const payload = await AdminAuthService.verifySessionToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.email).toBe("admin@test.com");
      expect(payload?.role).toBe("admin");
      expect(payload?.hideZohoBooks).toBe(false);
    });

    it("creates and verifies a valid JWT session token for manager", async () => {
      const token = await AdminAuthService.createSessionToken("manager@test.com", "manager", true);
      expect(token).toBeDefined();

      const payload = await AdminAuthService.verifySessionToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.email).toBe("manager@test.com");
      expect(payload?.role).toBe("manager");
      expect(payload?.hideZohoBooks).toBe(true);
    });

    it("rejects an invalid or tampered token", async () => {
      const token = await AdminAuthService.createSessionToken("admin@test.com");
      const tampered = token + "xyz";

      const payload = await AdminAuthService.verifySessionToken(tampered);
      expect(payload).toBeNull();
    });
  });

  describe("cookie session & requireAdmin guard", () => {
    it("sets cookie and allows requireAdmin()", async () => {
      const token = await AdminAuthService.createSessionToken("admin@test.com");
      await AdminAuthService.setSessionCookie(token);

      const session = await AdminAuthService.requireAdmin();
      expect(session.email).toBe("admin@test.com");
    });

    it("throws UnauthorizedError if cookie is missing", async () => {
      await expect(AdminAuthService.requireAdmin()).rejects.toThrow(UnauthorizedError);
    });

    it("clears session cookie on logout", async () => {
      const token = await AdminAuthService.createSessionToken("admin@test.com");
      await AdminAuthService.setSessionCookie(token);
      expect(mockCookieStorage["admin_session"]).toBeDefined();

      await AdminAuthService.clearSessionCookie();
      expect(mockCookieStorage["admin_session"]).toBeUndefined();
    });
  });
});
