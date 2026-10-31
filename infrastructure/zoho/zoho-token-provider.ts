import "server-only";
import fs from "fs";
import path from "path";
import { unstable_cache } from "next/cache";
import { env, requireEnv } from "../config/env";

interface ZohoTokenResponse {
  access_token: string;
  expires_in: number;
  api_domain?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

interface DiskCacheData {
  token: string;
  expiresAt: number;
  cachedAt: number;
}

const DISK_CACHE_FILE = path.join(process.cwd(), ".next", "cache", "zoho-oauth-token.json");

function readDiskCache(): DiskCacheData | null {
  try {
    if (fs.existsSync(DISK_CACHE_FILE)) {
      const raw = fs.readFileSync(DISK_CACHE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed?.token && typeof parsed.expiresAt === "number") {
        return parsed;
      }
    }
  } catch {
    // Ignore read errors
  }
  return null;
}

function writeDiskCache(token: string, expiresInSeconds: number): void {
  try {
    const dir = path.dirname(DISK_CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data: DiskCacheData = {
      token,
      // 5-minute safety buffer before expiration
      expiresAt: Date.now() + Math.max(60, expiresInSeconds - 300) * 1000,
      cachedAt: Date.now(),
    };
    fs.writeFileSync(DISK_CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Ignore write errors (e.g. read-only serverless environment)
  }
}

/**
 * Direct OAuth token fetch from Zoho Accounts.
 */
async function fetchZohoOAuthToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  accountsUrl: string,
): Promise<{ token: string; expiresIn: number }> {
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
    throw new Error(
      `Zoho token refresh error: ${data.error_description || data.error || "No access_token returned"}`,
    );
  }

  return {
    token: data.access_token,
    expiresIn: data.expires_in || 3600,
  };
}

/**
 * Shared token cached across all Next.js serverless functions for 50 minutes.
 */
const getSharedToken = unstable_cache(
  async (refreshToken: string, clientId: string, clientSecret: string, accountsUrl: string) => {
    const result = await fetchZohoOAuthToken(refreshToken, clientId, clientSecret, accountsUrl);
    return result;
  },
  ["zoho-oauth-token-v2"],
  {
    revalidate: 3000, // 50 minutes
    tags: ["zoho-token"],
  },
);

export class ZohoTokenProvider {
  private static cachedToken: string | null = null;
  private static expiresAt: number = 0;
  private static refreshPromise: Promise<string> | null = null;
  private static rateLimitUntil: number = 0;

  /**
   * Returns a valid access token.
   * Priority:
   * 1. In-process memory cache
   * 2. Persistent disk cache (.next/cache/zoho-oauth-token.json)
   * 3. Deduplicated in-flight fetch
   * 4. Next.js Data Cache / direct Zoho OAuth fetch
   */
  async getAccessToken(forceRefresh = false): Promise<string> {
    const now = Date.now();

    // 1. In-process memory cache check (fastest, 0 overhead)
    if (!forceRefresh && ZohoTokenProvider.cachedToken && ZohoTokenProvider.expiresAt > now) {
      return ZohoTokenProvider.cachedToken;
    }

    // 2. Persistent disk cache check (survives dev server restarts & process reloads)
    if (!forceRefresh) {
      const disk = readDiskCache();
      if (disk && disk.expiresAt > now) {
        ZohoTokenProvider.cachedToken = disk.token;
        ZohoTokenProvider.expiresAt = disk.expiresAt;
        return disk.token;
      }
    }

    // 3. If Zoho is currently rate-limiting us, protect against continuous hammer
    if (now < ZohoTokenProvider.rateLimitUntil) {
      const disk = readDiskCache();
      if (disk?.token) {
        // Fall back to disk token even if slightly expired during Zoho cooldown
        console.warn(
          `[ZohoTokenProvider] Zoho OAuth cooldown active (${Math.ceil((ZohoTokenProvider.rateLimitUntil - now) / 1000)}s left). Reusing last known disk token.`,
        );
        return disk.token;
      }
      throw new Error(
        `Zoho OAuth rate limit in effect. Cooldown active for ${Math.ceil((ZohoTokenProvider.rateLimitUntil - now) / 1000)} more seconds.`,
      );
    }

    // 4. Deduplicate concurrent in-flight refreshes in the same process
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

    try {
      let result: { token: string; expiresIn: number };

      if (forceRefresh) {
        result = await fetchZohoOAuthToken(
          config.ZOHO_REFRESH_TOKEN,
          config.ZOHO_CLIENT_ID,
          config.ZOHO_CLIENT_SECRET,
          ZOHO_ACCOUNTS_URL,
        );
      } else {
        try {
          result = await getSharedToken(
            config.ZOHO_REFRESH_TOKEN,
            config.ZOHO_CLIENT_ID,
            config.ZOHO_CLIENT_SECRET,
            ZOHO_ACCOUNTS_URL,
          );
        } catch {
          // Fallback to direct fetch if Next.js unstable_cache is unavailable
          result = await fetchZohoOAuthToken(
            config.ZOHO_REFRESH_TOKEN,
            config.ZOHO_CLIENT_ID,
            config.ZOHO_CLIENT_SECRET,
            ZOHO_ACCOUNTS_URL,
          );
        }
      }

      ZohoTokenProvider.cachedToken = result.token;
      ZohoTokenProvider.expiresAt = Date.now() + Math.max(60, result.expiresIn - 300) * 1000;
      ZohoTokenProvider.rateLimitUntil = 0;

      // Save to disk for cross-restart persistence
      writeDiskCache(result.token, result.expiresIn);

      return result.token;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("too many requests") || msg.includes("Access Denied")) {
        // Enforce a 3-minute cooldown so we don't keep hammering Zoho
        ZohoTokenProvider.rateLimitUntil = Date.now() + 180_000;
        console.warn("[ZohoTokenProvider] Zoho rate limit encountered. Initiated 3-minute cooldown window.");

        // If we have any disk token, return it as emergency fallback
        const disk = readDiskCache();
        if (disk?.token) {
          console.warn("[ZohoTokenProvider] Serving emergency fallback token from disk.");
          return disk.token;
        }
      }
      throw err;
    }
  }
}
