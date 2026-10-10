import { describe, expect, it } from "vitest";
import { galleryImageKey } from "@/core/domain/value-objects/gallery";
import { toSku } from "@/core/domain/value-objects/sku";
import { R2ImageStorage } from "./r2-image-storage";

describe("R2ImageStorage", () => {
  it("enforces R2 key naming conventions SKU/NN.ext", () => {
    const sku = toSku("SILK-100");
    expect(galleryImageKey(sku, 2, "image/jpeg")).toBe("SILK-100/02.jpg");
    expect(galleryImageKey(sku, 12, "image/webp")).toBe("SILK-100/12.webp");
    expect(galleryImageKey(sku, 5, "image/png")).toBe("SILK-100/05.png");
  });

  it("throws clear error when R2 environment variables are missing", async () => {
    const storage = new R2ImageStorage();

    // With env variables unconfigured in test environment, it must fail fast with a clear message
    await expect(storage.createUploadUrl(toSku("TEST-1"), 2, "image/jpeg")).rejects.toThrow(
      /Missing required env vars:.*R2_/,
    );
  });
});
