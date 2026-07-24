import { NextResponse } from "next/server";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export function GET() {
  return NextResponse.json({
    ok: true,
    name: APP_NAME,
    version: APP_VERSION,
  });
}
