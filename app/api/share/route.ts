import { NextResponse } from "next/server";
import { byteLengthUtf8, generateShareCode, hashSource } from "@/lib/share/codes";
import {
  SHARE_MAX_BYTES,
  SHARE_TTL_DAYS,
  type ShareTtlDays,
} from "@/lib/share/constants";
import {
  checkShareCreateRateLimit,
  clientIpFromRequest,
} from "@/lib/share/rate-limit";
import { siteConfig } from "@/lib/seo";
import { getSupabaseAdmin, isShareConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

type CreateBody = {
  source?: unknown;
  expiresInDays?: unknown;
};

function isTtl(n: number): n is ShareTtlDays {
  return (SHARE_TTL_DAYS as readonly number[]).includes(n);
}

export async function POST(req: Request) {
  if (!isShareConfigured()) {
    return NextResponse.json(
      { error: "Share service is not configured" },
      { status: 503 },
    );
  }

  const ip = clientIpFromRequest(req);
  const limit = checkShareCreateRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many share links. Try again later." },
      {
        status: 429,
        headers: limit.retryAfterSec
          ? { "Retry-After": String(limit.retryAfterSec) }
          : undefined,
      },
    );
  }

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const source = typeof body.source === "string" ? body.source : "";
  const expiresInDays = Number(body.expiresInDays);

  if (!source.trim()) {
    return NextResponse.json({ error: "Source is empty" }, { status: 400 });
  }
  if (!isTtl(expiresInDays)) {
    return NextResponse.json(
      { error: "expiresInDays must be 1, 3, or 7" },
      { status: 400 },
    );
  }

  const byteLength = byteLengthUtf8(source);
  if (byteLength > SHARE_MAX_BYTES) {
    return NextResponse.json(
      { error: `Source exceeds ${SHARE_MAX_BYTES} bytes` },
      { status: 413 },
    );
  }

  const contentHash = hashSource(source);
  const supabase = getSupabaseAdmin();
  const now = new Date();

  const { data: existing, error: lookupError } = await supabase
    .from("shared_programs")
    .select("code, expires_at, ttl_days")
    .eq("content_hash", contentHash)
    .eq("ttl_days", expiresInDays)
    .maybeSingle();

  if (lookupError) {
    console.error("share lookup failed", lookupError.message);
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 },
    );
  }

  if (existing) {
    const expiresAt = new Date(existing.expires_at as string);
    if (expiresAt > now) {
      const code = existing.code as string;
      return NextResponse.json({
        code,
        url: `${siteConfig.url}/s/${code}`,
        expiresAt: expiresAt.toISOString(),
        ttlDays: existing.ttl_days as number,
        reused: true,
      });
    }

    // Expired row blocks unique (content_hash, ttl_days) — replace it.
    const code = generateShareCode();
    const newExpiresAt = new Date(
      now.getTime() + expiresInDays * 24 * 60 * 60 * 1000,
    );
    const { data: replaced, error: replaceError } = await supabase
      .from("shared_programs")
      .update({
        code,
        source,
        byte_length: byteLength,
        created_at: now.toISOString(),
        expires_at: newExpiresAt.toISOString(),
      })
      .eq("content_hash", contentHash)
      .eq("ttl_days", expiresInDays)
      .select("code, expires_at, ttl_days")
      .single();

    if (replaceError || !replaced) {
      console.error("share replace failed", replaceError?.message);
      return NextResponse.json(
        { error: "Failed to create share link" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      code: replaced.code,
      url: `${siteConfig.url}/s/${replaced.code}`,
      expiresAt: replaced.expires_at,
      ttlDays: replaced.ttl_days,
      reused: false,
    });
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateShareCode();
    const expiresAt = new Date(
      now.getTime() + expiresInDays * 24 * 60 * 60 * 1000,
    );
    const row = {
      code,
      source,
      content_hash: contentHash,
      ttl_days: expiresInDays,
      byte_length: byteLength,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    const { data: inserted, error: insertError } = await supabase
      .from("shared_programs")
      .insert(row)
      .select("code, expires_at, ttl_days")
      .single();

    if (!insertError && inserted) {
      return NextResponse.json({
        code: inserted.code as string,
        url: `${siteConfig.url}/s/${inserted.code}`,
        expiresAt: inserted.expires_at as string,
        ttlDays: inserted.ttl_days as number,
        reused: false,
      });
    }

    // Unique code collision — retry; other errors fail.
    const msg = insertError?.message ?? "";
    if (!msg.includes("shared_programs_code") && !msg.includes("duplicate")) {
      // Race on dedup unique: re-fetch
      if (msg.includes("shared_programs_active_dedup") || msg.includes("content_hash")) {
        const { data: raced } = await supabase
          .from("shared_programs")
          .select("code, expires_at, ttl_days")
          .eq("content_hash", contentHash)
          .eq("ttl_days", expiresInDays)
          .maybeSingle();
        if (raced) {
          return NextResponse.json({
            code: raced.code,
            url: `${siteConfig.url}/s/${raced.code}`,
            expiresAt: raced.expires_at,
            ttlDays: raced.ttl_days,
            reused: true,
          });
        }
      }
      console.error("share insert failed", msg);
      return NextResponse.json(
        { error: "Failed to create share link" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { error: "Failed to allocate share code" },
    { status: 500 },
  );
}
