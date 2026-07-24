import { NextResponse } from "next/server";
import { SHARE_CODE_PATTERN } from "@/lib/share/constants";
import {
  getSupabaseAdmin,
  isShareConfigured,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

type Params = { params: Promise<{ code: string }> };

export async function GET(_req: Request, { params }: Params) {
  if (!isShareConfigured()) {
    return NextResponse.json(
      { error: "Share service is not configured" },
      { status: 503 },
    );
  }

  const { code: raw } = await params;
  const code = raw?.trim().toLowerCase() ?? "";
  if (!SHARE_CODE_PATTERN.test(code)) {
    return NextResponse.json({ error: "Invalid share code" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shared_programs")
    .select("source, expires_at, ttl_days, code")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("share fetch failed", error.message);
    return NextResponse.json(
      { error: "Failed to load share" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  const expiresAt = new Date(data.expires_at as string);
  if (expiresAt <= new Date()) {
    await supabase.from("shared_programs").delete().eq("code", code);
    return NextResponse.json({ error: "Share expired" }, { status: 410 });
  }

  return NextResponse.json({
    code: data.code,
    source: data.source,
    expiresAt: data.expires_at,
    ttlDays: data.ttl_days,
  });
}
