/**
 * Audit logger for sensitive Staff/Admin actions.
 * Logs: action, userId, role, ip, requestId, timestamp, and masked payload.
 * Per Tech Spec §5: PII must be masked before logging.
 */
import { maskPii } from "@/lib/pii";

export type AuditRole = "admin" | "staff";

export type AuditEntry = {
  action: string;
  userId: string;
  role: AuditRole;
  ip: string;
  requestId: string;
  timestamp: string;
  payload?: Record<string, unknown>;
};

/**
 * Log a sensitive action.
 * In production, swap console.log with a structured logging service (e.g. Axiom, Datadog).
 */
export function auditLog(entry: AuditEntry): void {
  const safe: AuditEntry = {
    ...entry,
    payload: entry.payload ? maskPii(entry.payload) : undefined,
  };
  console.log("[AUDIT]", JSON.stringify(safe));
}

/** Helper to build an audit entry from a Next.js Request */
export function buildAuditEntry(
  req: Request,
  action: string,
  userId: string,
  role: AuditRole,
  payload?: Record<string, unknown>
): AuditEntry {
  return {
    action,
    userId,
    role,
    ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown",
    requestId: req.headers.get("x-request-id") ?? crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    payload,
  };
}

/** Common action constants */
export const AuditActions = {
  STAFF_CALL_NEXT: "staff.call_next",
  STAFF_ABSENT: "staff.absent",
  STAFF_COMPLETE: "staff.complete",
  STAFF_END_SESSION: "staff.end_session",
  ADMIN_CLOSE_QUEUE: "admin.close_queue",
  ADMIN_DELETE_QUEUE: "admin.delete_queue",
} as const;
