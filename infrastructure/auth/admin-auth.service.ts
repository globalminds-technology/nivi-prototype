import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/infrastructure/config/env";
import { UnauthorizedError } from "@/core/domain/errors/domain-errors";

const COOKIE_NAME = "admin_session";
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface AdminUser {
  email: string;
  role: "admin" | "manager";
  hideZohoBooks: boolean;
}

export interface AdminSessionPayload {
  email: string;
  role: "admin" | "manager";
  hideZohoBooks: boolean;
}

function getJwtSecret(): Uint8Array {
  const config = env();
  const secret = config.AUTH_SECRET || "nivi-dev-auth-secret-min-32-chars-long!";
  return new TextEncoder().encode(secret);
}

export class AdminAuthService {
  /**
   * Verify provided email & password against configured admin / manager credentials.
   */
  static async verifyCredentials(email: string, password: string): Promise<AdminUser | null> {
    const config = env();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Primary Admin (Super Admin - full access including Zoho Books)
    const adminEmail = (config.ADMIN_EMAIL || "admin@nivi.in").toLowerCase();
    if (cleanEmail === adminEmail) {
      const adminHash = config.ADMIN_PASSWORD_HASH;
      const adminPlain = config.ADMIN_PASSWORD;

      let isPasswordValid = false;
      if (adminHash) {
        isPasswordValid = await bcrypt.compare(password, adminHash);
      } else if (adminPlain) {
        isPasswordValid = password === adminPlain;
      } else if (process.env.NODE_ENV !== "production" && password === "admin123") {
        isPasswordValid = true;
      }

      if (isPasswordValid) {
        return {
          email: adminEmail,
          role: "admin",
          hideZohoBooks: false,
        };
      }
      return null;
    }

    // 2. Saree & Catalog Manager (Restricted Admin - Zoho Books navigation hidden)
    const managerEmail = config.MANAGER_EMAIL?.trim().toLowerCase();
    if (managerEmail && cleanEmail === managerEmail) {
      const managerHash = config.MANAGER_PASSWORD_HASH;
      const managerPlain = config.MANAGER_PASSWORD;

      let isPasswordValid = false;
      if (managerHash) {
        isPasswordValid = await bcrypt.compare(password, managerHash);
      } else if (managerPlain) {
        isPasswordValid = password === managerPlain;
      } else if (process.env.NODE_ENV !== "production" && password === "manager123") {
        isPasswordValid = true;
      }

      if (isPasswordValid) {
        return {
          email: managerEmail,
          role: "manager",
          hideZohoBooks: true,
        };
      }
      return null;
    }

    return null;
  }

  /**
   * Sign a JWT session token.
   */
  static async createSessionToken(
    email: string,
    role: "admin" | "manager" = "admin",
    hideZohoBooks = false,
  ): Promise<string> {
    const secret = getJwtSecret();
    return new SignJWT({ email, role, hideZohoBooks })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
      .sign(secret);
  }

  /**
   * Verify and decode a JWT session token.
   */
  static async verifySessionToken(token: string): Promise<AdminSessionPayload | null> {
    try {
      const secret = getJwtSecret();
      const { payload } = await jwtVerify(token, secret);
      if (
        (payload.role !== "admin" && payload.role !== "manager") ||
        typeof payload.email !== "string"
      ) {
        return null;
      }
      return {
        email: payload.email,
        role: payload.role as "admin" | "manager",
        hideZohoBooks: Boolean(payload.hideZohoBooks),
      };
    } catch {
      return null;
    }
  }

  /**
   * Set HTTP-only admin session cookie.
   */
  static async setSessionCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });
  }

  /**
   * Clear admin session cookie.
   */
  static async clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  }

  /**
   * Read current session payload from request cookies.
   */
  static async getCurrentSession(): Promise<AdminSessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return this.verifySessionToken(token);
  }

  /**
   * Server Action & Route guard. Throws UnauthorizedError if not logged in.
   */
  static async requireAdmin(): Promise<AdminSessionPayload> {
    const session = await this.getCurrentSession();
    if (!session) {
      throw new UnauthorizedError("Admin session required or expired");
    }
    return session;
  }
}
