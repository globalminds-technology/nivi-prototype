import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/infrastructure/config/env";
import { UnauthorizedError } from "@/core/domain/errors/domain-errors";

const COOKIE_NAME = "admin_session";
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface AdminSessionPayload {
  email: string;
  role: "admin";
}

function getJwtSecret(): Uint8Array {
  const config = env();
  const secret = config.AUTH_SECRET || "nivi-dev-auth-secret-min-32-chars-long!";
  return new TextEncoder().encode(secret);
}

export class AdminAuthService {
  /**
   * Verify provided email & password against configured admin credentials.
   */
  static async verifyCredentials(email: string, password: string): Promise<boolean> {
    const config = env();
    const adminEmail = config.ADMIN_EMAIL || "admin@nivi.in";
    const adminHash = config.ADMIN_PASSWORD_HASH;

    if (email.trim().toLowerCase() !== adminEmail.toLowerCase()) {
      return false;
    }

    if (!adminHash) {
      // In development, if hash is not set, allow a default fallback dev password with a warning
      if (process.env.NODE_ENV !== "production" && password === "admin123") {
        return true;
      }
      return false;
    }

    return bcrypt.compare(password, adminHash);
  }

  /**
   * Sign a JWT session token.
   */
  static async createSessionToken(email: string): Promise<string> {
    const secret = getJwtSecret();
    return new SignJWT({ email, role: "admin" })
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
      if (payload.role !== "admin" || typeof payload.email !== "string") {
        return null;
      }
      return {
        email: payload.email,
        role: "admin",
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
