import { NextResponse } from "next/server";
import { container } from "@/infrastructure/di/container";

export async function POST() {
  try {
    // Refresh catalog cache tag so Next.js serves fresh data immediately
    const useCase = container.refreshCatalog();
    await useCase.execute();

    return NextResponse.json({
      ok: true,
      synced: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("Zoho webhook error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to handle Zoho webhook" },
      { status: 500 },
    );
  }
}
