/**
 * HMAC-SHA256 signature for QR URL payloads.
 * Prevents tampering with queue/stream params in QR codes.
 *
 * Usage:
 *   Sign:   const url = signQrUrl("https://app.com/q/123", secret)
 *   Verify: const ok  = verifyQrUrl(url, secret)
 */
import { createHmac, timingSafeEqual } from "crypto";

const SIG_PARAM = "_sig";

/** Attach HMAC signature to a URL as a query param */
export function signQrUrl(url: string, secret: string): string {
  const sig = computeSig(url, secret);
  const u = new URL(url);
  u.searchParams.set(SIG_PARAM, sig);
  return u.toString();
}

/**
 * Verify a QR URL signature.
 * Returns true if valid or if QR_SECRET is not configured (graceful degradation).
 */
export function verifyQrUrl(url: string, secret: string | undefined): boolean {
  if (!secret) return true; // degraded mode: skip verification

  const u = new URL(url);
  const receivedSig = u.searchParams.get(SIG_PARAM);
  if (!receivedSig) return false;

  // Remove sig param before recomputing
  u.searchParams.delete(SIG_PARAM);
  const expectedSig = computeSig(u.toString(), secret);

  try {
    return timingSafeEqual(
      Buffer.from(receivedSig, "hex"),
      Buffer.from(expectedSig, "hex")
    );
  } catch {
    return false;
  }
}

function computeSig(url: string, secret: string): string {
  return createHmac("sha256", secret).update(url).digest("hex");
}

/** Extract queueId from a signed QR URL (returns null if not found) */
export function extractQueueIdFromUrl(url: string): string | null {
  try {
    const parts = new URL(url).pathname.split("/");
    const idx = parts.indexOf("q");
    return idx !== -1 ? (parts[idx + 1] ?? null) : null;
  } catch {
    return null;
  }
}
