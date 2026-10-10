import { NextResponse, type NextRequest } from "next/server";
import { container } from "@/infrastructure/di/container";

export async function GET(request: NextRequest) {
  const cronSecret = container.getCronSecret();
  const authHeader = request.headers.get("authorization");

  if (cronSecret) {
    const expected = `Bearer ${cronSecret}`;
    if (authHeader !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const useCase = container.refreshCatalog();
    await useCase.execute();

    return NextResponse.json({
      ok: true,
      revalidated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("Cron revalidate failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to revalidate catalog" },
      { status: 500 },
    );
  }
}
