import { describe, it, expect, vi } from "vitest";
import { lookupPincodeAction } from "@/app/actions/checkout";

describe("lookupPincodeAction", () => {
  it("rejects invalid pincodes immediately without calling fetch", async () => {
    const res = await lookupPincodeAction("123");
    expect(res.success).toBe(false);
    expect(res.error).toContain("valid 6-digit");
  });

  it("handles valid pincode response and extracts district, state, and places", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          Status: "Success",
          PostOffice: [
            {
              Name: "Mylapore",
              District: "Chennai",
              State: "Tamil Nadu",
            },
            {
              Name: "Mandaveli",
              District: "Chennai",
              State: "Tamil Nadu",
            },
          ],
        },
      ],
    });
    vi.stubGlobal("fetch", mockFetch);

    const res = await lookupPincodeAction("600004");
    expect(res.success).toBe(true);
    expect(res.city).toBe("Chennai");
    expect(res.state).toBe("Tamil Nadu");
    expect(res.places).toEqual(["Mylapore", "Mandaveli"]);

    vi.unstubAllGlobals();
  });
});
