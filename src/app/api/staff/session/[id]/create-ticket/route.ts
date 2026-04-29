import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getStaffUser } from "@/lib/get-staff-user";
import { createTicket } from "@/lib/join-service";
import { ok, fail } from "@/lib/api-response";

const CreateTicketSchema = z.object({
  streamId: z.string().nullable().optional(),
  customerName: z.string().max(100).optional(),
  customerPhone: z.string().max(30).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getStaffUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sessionId } = await params;

  const staffSession = await prisma.staffSession.findUnique({
    where: { id: sessionId, userId: user.id, status: "ACTIVE" },
    select: { id: true, queueId: true, streamIds: true },
  });
  if (!staffSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.flatten().fieldErrors);
  }

  const { streamId, customerName, customerPhone } = parsed.data;

  // Validate streamId belongs to this session
  if (streamId && !staffSession.streamIds.includes(streamId)) {
    return fail("Stream not assigned to this session");
  }

  const customerInfo =
    customerName || customerPhone
      ? { name: customerName ?? "", phone: customerPhone ?? "" }
      : undefined;

  // deviceId marker — unique per session, avoids 409 on consecutive creates
  const deviceId = `STAFF:${sessionId}:${Date.now()}`;

  const result = await createTicket({
    queueId: staffSession.queueId,
    deviceId,
    streamId: streamId ?? undefined,
    customerInfo,
  });

  return ok(result);
}
