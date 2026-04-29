import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getStaffUser } from "@/lib/get-staff-user";
import { broadcastToQueue, broadcastToSession } from "@/lib/sse";
import { sendPushToTicket } from "@/lib/push";
import { ok, fail } from "@/lib/api-response";

const ReassignSchema = z.object({
  ticketId: z.string().min(1),
  targetSessionId: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getStaffUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sessionId } = await params;

  // Load current session
  const currentSession = await prisma.staffSession.findUnique({
    where: { id: sessionId, userId: user.id, status: "ACTIVE" },
    include: { counter: { select: { name: true } } },
  });
  if (!currentSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ReassignSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.flatten().fieldErrors);
  }

  const { ticketId, targetSessionId } = parsed.data;

  // Verify ticket is active and in this session's queue
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      queueId: currentSession.queueId,
      status: { in: ["CALLED", "SERVING"] },
    },
  });
  if (!ticket) {
    return fail("Ticket not found or not eligible for reassignment", 404);
  }

  // Verify target session is active in same queue
  const targetSession = await prisma.staffSession.findFirst({
    where: { id: targetSessionId, queueId: currentSession.queueId, status: "ACTIVE" },
    include: { counter: { select: { name: true } } },
  });
  if (!targetSession) {
    return fail("Target session not found or not active", 404);
  }

  // Reassign ticket to target session
  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { staffSessionId: targetSessionId },
  });

  const counterName = targetSession.counter.name;

  // SSE: broadcast to queue (customer page updates)
  broadcastToQueue(currentSession.queueId, {
    type: "ticket:reassigned",
    data: { ticketId: updated.id, displayNumber: updated.displayNumber, counterName },
  });

  // SSE: notify target session
  broadcastToSession(targetSessionId, {
    type: "session:ticket_assigned",
    data: { ticketId: updated.id, displayNumber: updated.displayNumber },
  });

  // Push notification to customer
  sendPushToTicket(ticketId, {
    title: "Counter Updated",
    body: `Please proceed to counter ${counterName}`,
    data: { queueId: currentSession.queueId, ticketId },
  }).catch(() => {}); // non-blocking, best-effort

  return ok({ ticket: updated, counterName });
}
