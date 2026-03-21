import { NextRequest, NextResponse } from "next/server";
import { getStaffUser } from "@/lib/get-staff-user";
import { prisma } from "@/lib/prisma";
import { broadcastToQueue, broadcastToSession } from "@/lib/sse";
import { sendPushToTicket } from "@/lib/push";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getStaffUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const staffSession = await prisma.staffSession.findUnique({
    where: { id, userId: user.id, status: "ACTIVE" },
    include: { counter: { select: { name: true } } },
  });

  if (!staffSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Mark any currently-serving ticket as completed (if staff presses next without completing)
  await prisma.ticket.updateMany({
    where: { staffSessionId: id, status: "SERVING" },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  // Find next WAITING ticket in any of the staff's streams
  const nextTicket = await prisma.ticket.findFirst({
    where: {
      queueId: staffSession.queueId,
      streamId: { in: staffSession.streamIds },
      status: "WAITING",
    },
    orderBy: { ticketNumber: "asc" },
    include: { stream: { select: { name: true } } },
  });

  if (!nextTicket) {
    return NextResponse.json({ ticket: null, message: "No waiting tickets" });
  }

  const updated = await prisma.ticket.update({
    where: { id: nextTicket.id },
    data: { status: "CALLED", calledAt: new Date(), staffSessionId: id },
  });

  // Broadcast queue event
  broadcastToQueue(staffSession.queueId, {
    type: "ticket:called",
    data: {
      ticketId: updated.id,
      displayNumber: updated.displayNumber,
      counterName: staffSession.counter.name,
    },
  });

  // Broadcast to staff session (include verifyCode for staff display)
  broadcastToSession(id, {
    type: "ticket:called",
    data: {
      ticketId: updated.id,
      displayNumber: updated.displayNumber,
      streamName: nextTicket.stream.name,
      verifyCode: updated.verifyCode,
    },
  });

  // Send push notification to customer
  try {
    await sendPushToTicket(updated.id, {
      title: "Your turn! 🎉",
      body: `Ticket ${updated.displayNumber} - please proceed to ${staffSession.counter.name}`,
      data: { queueId: staffSession.queueId, ticketId: updated.id },
    });
  } catch (err) {
    console.error("Push notification failed:", err);
  }

  return NextResponse.json({
    ticket: {
      id: updated.id,
      displayNumber: updated.displayNumber,
      streamName: nextTicket.stream.name,
      verifyCode: updated.verifyCode,
      status: updated.status,
    },
  });
}
