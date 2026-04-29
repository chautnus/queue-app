/**
 * Standardised API response envelope.
 * { success, data, error, meta: { timestamp, requestId } }
 */
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export type ApiEnvelope<T = unknown> = {
  success: boolean;
  data: T | null;
  error: string | Record<string, unknown> | null;
  meta: { timestamp: string; requestId: string };
};

function buildMeta(requestId?: string) {
  return {
    timestamp: new Date().toISOString(),
    requestId: requestId ?? randomUUID(),
  };
}

export function ok<T>(data: T, status = 200, requestId?: string): NextResponse {
  const body: ApiEnvelope<T> = {
    success: true,
    data,
    error: null,
    meta: buildMeta(requestId),
  };
  return NextResponse.json(body, { status });
}

export function fail(
  error: string | Record<string, unknown>,
  status = 400,
  requestId?: string
): NextResponse {
  const body: ApiEnvelope<null> = {
    success: false,
    data: null,
    error,
    meta: buildMeta(requestId),
  };
  return NextResponse.json(body, { status });
}

/** Extract or generate a requestId from the incoming request */
export function getRequestId(req: Request): string {
  return req.headers.get("x-request-id") ?? randomUUID();
}
