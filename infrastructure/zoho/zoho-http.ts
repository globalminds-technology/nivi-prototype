import "server-only";
import { env, requireEnv } from "../config/env";
import type { ZohoTokenProvider } from "./zoho-token-provider";

export interface ZohoApiResponse {
  code: number;
  message: string;
  [key: string]: unknown;
}

export class ZohoApiError extends Error {
  constructor(
    readonly code: number,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(`Zoho API error (${code}): ${message}`);
    this.name = "ZohoApiError";
  }
}

export class ZohoHttpClient {
  constructor(private readonly tokenProvider: ZohoTokenProvider) {}

  private async request(
    path: string,
    options: RequestInit = {},
    attempt = 1,
  ): Promise<Response> {
    const { ZOHO_ORG_ID } = requireEnv("ZOHO_ORG_ID");
    const { ZOHO_API_DOMAIN } = env();
    const token = await this.tokenProvider.getAccessToken(attempt > 1);

    const baseUrl = ZOHO_API_DOMAIN.replace(/\/+$/, "");
    const url = new URL(`${baseUrl}/books/v3/${path.replace(/^\/+/, "")}`);

    // Automatically append organization_id
    if (!url.searchParams.has("organization_id")) {
      url.searchParams.set("organization_id", ZOHO_ORG_ID);
    }

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Zoho-oauthtoken ${token}`);

    // If body is JSON string and no Content-Type set, set application/json
    if (typeof options.body === "string" && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json;charset=UTF-8");
    }

    const res = await fetch(url.toString(), {
      cache: "no-store",
      ...options,
      headers,
    });

    // 1. Handle token expiration (401) with 1 retry
    if (res.status === 401 && attempt < 2) {
      // Force refresh token and retry
      await this.tokenProvider.getAccessToken(true);
      return this.request(path, options, attempt + 1);
    }

    // 2. Handle rate limits (429) with backoff
    if (res.status === 429 && attempt < 3) {
      const waitMs = attempt * 1500;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return this.request(path, options, attempt + 1);
    }

    return res;
  }

  async get<T>(path: string, searchParams?: Record<string, string>): Promise<T> {
    let fullPath = path;
    if (searchParams) {
      const sp = new URLSearchParams(searchParams);
      fullPath += (path.includes("?") ? "&" : "?") + sp.toString();
    }

    const res = await this.request(fullPath, { method: "GET" });
    return this.handleResponse<T>(res);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await this.request(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    });
    return this.handleResponse<T>(res);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const res = await this.request(path, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    });
    return this.handleResponse<T>(res);
  }

  async delete<T>(path: string): Promise<T> {
    const res = await this.request(path, { method: "DELETE" });
    return this.handleResponse<T>(res);
  }

  async getBinary(path: string, searchParams?: Record<string, string>): Promise<Uint8Array> {
    let fullPath = path;
    if (searchParams) {
      const sp = new URLSearchParams(searchParams);
      fullPath += (path.includes("?") ? "&" : "?") + sp.toString();
    }

    const res = await this.request(fullPath, { method: "GET" });
    if (!res.ok) {
      const errText = await res.text();
      throw new ZohoApiError(res.status, errText, res.status);
    }

    const arrayBuffer = await res.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  async getImageBinary(path: string): Promise<{ data: Uint8Array; contentType: string } | null> {
    const res = await this.request(path, { method: "GET" });
    if (!res.ok) {
      return null;
    }
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();
    return {
      data: new Uint8Array(arrayBuffer),
      contentType,
    };
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    const text = await res.text();
    let json: ZohoApiResponse;

    try {
      json = JSON.parse(text) as ZohoApiResponse;
    } catch {
      throw new ZohoApiError(res.status, `Non-JSON response from Zoho Books: ${text}`, res.status);
    }

    // Zoho code 0 indicates success
    if (json.code !== 0 && !res.ok) {
      throw new ZohoApiError(json.code, json.message || "Zoho request failed", res.status, json);
    }

    return json as unknown as T;
  }
}
