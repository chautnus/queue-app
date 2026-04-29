/**
 * GET /api/health/live
 * Liveness probe: confirms process is running and can respond.
 * Always returns 200 unless the process itself is broken.
 */
import { NextResponse } from "next/server";

const _startTime = Date.now();

export async function GET() {
  return NextResponse.json({
    status: "live",
    uptimeSeconds: Math.floor((Date.now() - _startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
}
