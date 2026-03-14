import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastToQueue, broadcastToSession } from "@/lib/sse";
import { z } from "zod";

const CompleteSchema = z.object({
  displayNumber: z.string(),
  verifyCode: z.string().length(4),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const staffSession = await prisma.staffSession.findUnique({
    where: { id, userId: session.user.id, status: "ACTIVE" },
  });

  if (!staffSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = CompleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input" },
      { status: 400 }
    );
  }

  const { displayNumber, verifyCode } = parsed.data;

  // Find the ticket
  const ticket = await prisma.ticket.findFirst({
    where: {
      queueId: staffSession.queueId,
      displayNumber: { equals: displayNumber, mode: "insensitive" },
      verifyCode,
      status: { in: ["WAITING", "CALLED"] },
    },
  });

  if (!ticket) {
    return NextResponse.json(
      { error: "Invalid ticket number or verification code" },
      { status: 400 }
    );
  }

  const now = new Date();
  const serviceSeconds = ticket.calledAt
    ? Math.round((now.getTime() - ticket.calledAt.getTime()) / 1000)
    : 0;

  const [updatedTicket] = await prisma.$transaction([
    prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "SERVING",
        servedAt: now,
        staffSessionId: id,
      },
    }),
    prisma.staffSession.update({
      where: { id },
      data: {
        servedCount: { increment: 1 },
        totalServiceSeconds: { increment: serviceSeconds },
      },
    }),
  ]);

  broadcastToQueue(staffSession.queueId, {
    type: "ticket:serving",
    data: { ticketId: ticket.id, displayNumber },
  });

  broadcastToSession(id, {
    type: "ticket:serving",
    data: { ticketId: ticket.id, displayNumber },
  });

  return NextResponse.json({ ticket: updatedTicket });
}
