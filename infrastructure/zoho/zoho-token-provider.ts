import "server-only";
import { unstable_cache } from "next/cache";
import { env, requireEnv } from "../config/env";

interface ZohoTokenResponse {
  access_token: string;
  expires_in: number;
  api_domain?: string;
  token_type?: string;
  error?: string;
}

/**
 * Direct OAuth token fetch from Zoho Accounts.
 */
async function fetchZohoOAuthToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  accountsUrl: string,
): Promise<string> {
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  const url = `${accountsUrl.replace(/\/+$/, "")}/oauth/v2/token?${params.toString()}`;

  const res = await fetch(url, {
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

  return data.access_token;
}

/**
 * Shared token cached across all Vercel serverless functions for 50 minutes.
 * This guarantees only 1 request is sent to Zoho OAuth every 50 minutes, preventing rate limits.
 */
const getSharedToken = unstable_cache(
  async (refreshToken: string, clientId: string, clientSecret: string, accountsUrl: string) => {
    return fetchZohoOAuthToken(refreshToken, clientId, clientSecret, accountsUrl);
  },
  ["zoho-oauth-token-v1"],
  {
    revalidate: 3000, // 50 minutes
    tags: ["zoho-token"],
  },
);

export class ZohoTokenProvider {
  private static cachedToken: string | null = null;
  private static expiresAt: number = 0;
  private static refreshPromise: Promise<string> | null = null;

  /**
   * Returns a valid access token.
   * Leverages Next.js Data Cache to share a single token across all serverless functions
   * for 50 minutes, preventing Zoho's "Too many requests" OAuth rate limiter.
   */
  async getAccessToken(forceRefresh = false): Promise<string> {
    const now = Date.now();

    // 1. In-process memory cache check (fastest, 0 overhead)
    if (!forceRefresh && ZohoTokenProvider.cachedToken && ZohoTokenProvider.expiresAt > now + 300_000) {
      return ZohoTokenProvider.cachedToken;
    }

    // 2. Deduplicate concurrent in-flight refreshes in the same process
    if (ZohoTokenProvider.refreshPromise) {
      return ZohoTokenProvider.refreshPromise;
    }

    ZohoTokenProvider.refreshPromise = this.resolveToken(forceRefresh).finally(() => {
      ZohoTokenProvider.refreshPromise = null;
    });

    return ZohoTokenProvider.refreshPromise;
  }

  private async resolveToken(forceRefresh: boolean): Promise<string> {
    const config = requireEnv(
      "ZOHO_REFRESH_TOKEN",
      "ZOHO_CLIENT_ID",
      "ZOHO_CLIENT_SECRET",
    );
    const { ZOHO_ACCOUNTS_URL } = env();

    let token: string;

    if (forceRefresh) {
      token = await fetchZohoOAuthToken(
        config.ZOHO_REFRESH_TOKEN,
        config.ZOHO_CLIENT_ID,
        config.ZOHO_CLIENT_SECRET,
        ZOHO_ACCOUNTS_URL,
      );
    } else {
      try {
        token = await getSharedToken(
          config.ZOHO_REFRESH_TOKEN,
          config.ZOHO_CLIENT_ID,
          config.ZOHO_CLIENT_SECRET,
          ZOHO_ACCOUNTS_URL,
        );
      } catch {
        // Fallback to direct fetch if Next.js cache is unavailable
        token = await fetchZohoOAuthToken(
          config.ZOHO_REFRESH_TOKEN,
          config.ZOHO_CLIENT_ID,
          config.ZOHO_CLIENT_SECRET,
          ZOHO_ACCOUNTS_URL,
        );
      }
    }

    ZohoTokenProvider.cachedToken = token;
    ZohoTokenProvider.expiresAt = Date.now() + 3000 * 1000;

    return token;
  }
}

