/**
 * GET /api/health/ready
 * Readiness probe: checks DB connectivity + Redis (if configured).
 * Returns 200 when all dependencies are healthy, 503 otherwise.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};
  let allOk = true;

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
    allOk = false;
  }

  // Redis check (only if REDIS_URL is set)
  if (process.env.REDIS_URL) {
    try {
      const redis = await getRedis();
      if (redis) {
        await redis.ping();
        checks.redis = "ok";
      } else {
        checks.redis = "error";
        allOk = false;
      }
    } catch {
      checks.redis = "error";
      allOk = false;
    }
  }

  return NextResponse.json(
    { status: allOk ? "ready" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
