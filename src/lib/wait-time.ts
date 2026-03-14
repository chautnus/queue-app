import { prisma } from "@/lib/prisma";
import { getStartOfDayInTz } from "@/lib/date-utils";

export async function estimateWaitTime(
  streamId: string,
  targetTicketNumber: number,
  timezone: string
): Promise<{ waitingAhead: number; estimatedSeconds: number }> {
  const startOfToday = getStartOfDayInTz(timezone);

  const [waitingAhead, activeCounters, stream] = await Promise.all([
    // Count tickets waiting ahead in same stream today
    prisma.ticket.count({
      where: {
        streamId,
        status: { in: ["WAITING", "CALLED"] },
        ticketNumber: { lt: targetTicketNumber },
        createdAt: { gte: startOfToday },
      },
    }),
    // Count active staff sessions serving this stream
    prisma.staffSession.count({
      where: {
        status: "ACTIVE",
        streamIds: { has: streamId },
      },
    }),
    prisma.stream.findUniqueOrThrow({
      where: { id: streamId },
      select: { avgProcessingSeconds: true },
    }),
  ]);

  if (activeCounters === 0) {
    return {
      waitingAhead,
      estimatedSeconds: waitingAhead * stream.avgProcessingSeconds,
    };
  }

  const positionInQueue = Math.ceil(waitingAhead / activeCounters);
  return {
    waitingAhead,
    estimatedSeconds: positionInQueue * stream.avgProcessingSeconds,
  };
}

export function formatWaitTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
