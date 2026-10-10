import "server-only";
import { SignJWT, jwtVerify } from "jose";
import type { ReviewTokenPayload, TokenSigner } from "@/core/application/ports/token-signer";
import { env } from "@/infrastructure/config/env";

export class JoseTokenSigner implements TokenSigner {
  private getSecret(): Uint8Array {
    const secret =
      env().REVIEW_LINK_SECRET ||
      env().AUTH_SECRET ||
      "nivi-dev-review-link-secret-at-least-32-chars-long";
    return new TextEncoder().encode(secret);
  }

  async signReviewToken(
    payload: ReviewTokenPayload,
    expiresInSeconds = 30 * 24 * 3600,
  ): Promise<string> {
    return new SignJWT({ invoiceId: payload.invoiceId, sku: payload.sku })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${expiresInSeconds}s`)
      .sign(this.getSecret());
  }

  async verifyReviewToken(token: string): Promise<ReviewTokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.getSecret());
      if (typeof payload.invoiceId === "string" && typeof payload.sku === "string") {
        return {
          invoiceId: payload.invoiceId,
          sku: payload.sku,
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}
