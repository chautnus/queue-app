/**
 * Core ticket-creation business logic — extracted from join/route.ts
 * so the route stays thin and the transaction wraps allocateTicketNumber.
 */
import { prisma } from "@/lib/prisma";
import { allocateTicketNumber, generateVerifyCode } from "@/lib/ticket";
import { broadcastToQueue } from "@/lib/sse";
import { estimateWaitTime } from "@/lib/wait-time";

export type JoinInput = {
  queueId: string;
  deviceId: string;
  streamId?: string | null;
  customerInfo?: Record<string, unknown>;
};

export type JoinResult = {
  id: string;
  displayNumber: string;
  verifyCode: string;
  streamName: string;
  status: string;
  waitingAhead: number;
  estimatedSeconds: number;
};

export async function createTicket(input: JoinInput): Promise<JoinResult> {
  const { queueId, deviceId, streamId, customerInfo } = input;

  const queue = await prisma.queue.findUniqueOrThrow({
    where: { id: queueId },
    include: { streams: { orderBy: { order: "asc" } } },
  });

  const isStaffAssign = queue.streamAssignMode === "STAFF_ASSIGN";
  const targetStreamId =
    isStaffAssign && !streamId ? null : (streamId ?? queue.streams[0]?.id ?? null);

  // Run allocation + ticket creation in a single transaction.
  // allocateTicketNumber uses SELECT...FOR UPDATE — must be inside tx.
  const ticket = await prisma.$transaction(async (tx) => {
    let number: number;
    let displayNumber: string;

    if (targetStreamId) {
      const allocated = await allocateTicketNumber(tx, targetStreamId, queue.timezone);
      number = allocated.number;
      displayNumber = allocated.displayNumber;
    } else {
      // STAFF_ASSIGN without stream: simple sequential counter
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const count = await tx.ticket.count({
        where: { queueId, createdAt: { gte: todayStart } },
      });
      number = count + 1;
      displayNumber = `Q${String(number).padStart(3, "0")}`;
    }

    const verifyCode = generateVerifyCode();

    const t = await tx.ticket.create({
      data: {
        queueId,
        streamId: targetStreamId,
        ticketNumber: number,
        displayNumber,
        verifyCode,
        deviceId,
        customerInfo: customerInfo ? JSON.parse(JSON.stringify(customerInfo)) : null,
      },
      include: { stream: { select: { name: true, avgProcessingSeconds: true } } },
    });

    await tx.deviceRegistration.upsert({
      where: { queueId_deviceId: { queueId, deviceId } },
      create: { queueId, deviceId, ticketId: t.id },
      update: { ticketId: t.id },
    });

    return t;
  });

  // Estimate wait time outside transaction
  let waitingAhead = 0;
  let estimatedSeconds = 0;

  if (targetStreamId) {
    const info = await estimateWaitTime(targetStreamId, ticket.ticketNumber, queue.timezone);
    waitingAhead = info.waitingAhead;
    estimatedSeconds = info.estimatedSeconds;
  } else {
    waitingAhead = await prisma.ticket.count({
      where: { queueId, status: "WAITING", ticketNumber: { lt: ticket.ticketNumber } },
    });
  }

  broadcastToQueue(queueId, {
    type: "ticket:created",
    data: {
      ticketId: ticket.id,
      displayNumber: ticket.displayNumber,
      streamId: targetStreamId,
      waitingAhead,
    },
  });

  return {
    id: ticket.id,
    displayNumber: ticket.displayNumber,
    verifyCode: ticket.verifyCode,
    streamName: ticket.stream?.name ?? "",
    status: ticket.status,
    waitingAhead,
    estimatedSeconds,
  };
}
