import {
  SHARE_CREATE_RATE_LIMIT,
  SHARE_CREATE_RATE_WINDOW_MS,
} from "@/lib/share/constants";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** In-memory IP rate limit (per server instance). */
export function checkShareCreateRateLimit(ip: string): {
  ok: boolean;
  retryAfterSec?: number;
} {
  const now = Date.now();
  const key = ip || "unknown";
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + SHARE_CREATE_RATE_WINDOW_MS };
    buckets.set(key, bucket);
  }

  if (bucket.count >= SHARE_CREATE_RATE_LIMIT) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true };
}

export function clientIpFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
