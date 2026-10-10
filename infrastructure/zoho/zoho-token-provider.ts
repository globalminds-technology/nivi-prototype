import "server-only";
import { env, requireEnv } from "../config/env";

interface ZohoTokenResponse {
  access_token: string;
  expires_in: number;
  api_domain?: string;
  token_type?: string;
  error?: string;
}

export class ZohoTokenProvider {
  private cachedToken: string | null = null;
  private expiresAt: number = 0;
  private refreshPromise: Promise<string> | null = null;

  /**
   * Returns a valid access token. Reuses cached token in-memory if still valid,
   * otherwise requests a fresh access token from Zoho Accounts.
   * Deduplicates concurrent refresh calls.
   */
  async getAccessToken(forceRefresh = false): Promise<string> {
    const now = Date.now();
    // Re-use token if it has at least 5 minutes (300,000 ms) of validity remaining
    if (!forceRefresh && this.cachedToken && this.expiresAt > now + 300_000) {
      return this.cachedToken;
    }

    // If a refresh is already in-flight, await the same promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.refreshToken().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  private async refreshToken(): Promise<string> {
    const config = requireEnv(
      "ZOHO_REFRESH_TOKEN",
      "ZOHO_CLIENT_ID",
      "ZOHO_CLIENT_SECRET",
    );
    const { ZOHO_ACCOUNTS_URL } = env();

    const params = new URLSearchParams({
      refresh_token: config.ZOHO_REFRESH_TOKEN,
      client_id: config.ZOHO_CLIENT_ID,
      client_secret: config.ZOHO_CLIENT_SECRET,
      grant_type: "refresh_token",
    });

    const accountsUrl = `${ZOHO_ACCOUNTS_URL.replace(/\/+$/, "")}/oauth/v2/token?${params.toString()}`;

    const res = await fetch(accountsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Zoho token refresh failed with HTTP ${res.status}: ${errorText}`);
    }

    const data = (await res.json()) as ZohoTokenResponse;

    if (data.error || !data.access_token) {
      throw new Error(`Zoho token refresh error: ${data.error || "No access_token returned"}`);
    }

    this.cachedToken = data.access_token;
    // expires_in is in seconds; fallback to 3600 (1 hour)
    const expiresInMs = (data.expires_in || 3600) * 1000;
    this.expiresAt = Date.now() + expiresInMs;

    return this.cachedToken;
  }
}
