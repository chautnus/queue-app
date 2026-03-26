import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [queue, streamStats, activeSessions, todayTickets] = await Promise.all([
      prisma.queue.findUnique({
        where: { id, ownerId: session.user.id },
        select: { id: true, name: true, status: true, operatingHours: true },
      }),
      prisma.stream.findMany({
        where: { queueId: id },
        include: {
          _count: {
            select: {
              tickets: true,
            },
          },
          tickets: {
            where: { status: { in: ["WAITING", "CALLED", "SERVING"] } },
            select: { status: true },
          },
        },
        orderBy: { order: "asc" },
      }),
      prisma.staffSession.findMany({
        where: { queueId: id, status: "ACTIVE" },
        include: {
          user: { select: { name: true, email: true } },
          counter: { select: { name: true } },
        },
      }),
      prisma.ticket.findMany({
        where: {
          queueId: id,
          createdAt: { gte: todayStart },
        },
        select: { createdAt: true, calledAt: true, completedAt: true, status: true },
      }),
    ]);

    if (!queue) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const stats = {
      queue,
      streams: streamStats.map((s) => ({
        id: s.id,
        name: s.name,
        waiting: s.tickets.filter((t) => t.status === "WAITING").length,
        called: s.tickets.filter((t) => t.status === "CALLED").length,
        serving: s.tickets.filter((t) => t.status === "SERVING").length,
        total: s._count.tickets,
      })),
      activeSessions: activeSessions.map((sess) => ({
        id: sess.id,
        staffName: sess.user.name ?? sess.user.email,
        counter: sess.counter.name,
        servedCount: sess.servedCount,
        startAt: sess.startAt,
      })),
      totalWaiting: streamStats.reduce(
        (sum, s) => sum + s.tickets.filter((t) => t.status === "WAITING").length,
        0
      ),
      totalServing: streamStats.reduce(
        (sum, s) => sum + s.tickets.filter((t) => t.status === "SERVING").length,
        0
      ),
      avgWaitSeconds: (() => {
        const waits = todayTickets
          .filter((t) => t.calledAt)
          .map((t) => (t.calledAt!.getTime() - t.createdAt.getTime()) / 1000);
        return waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0;
      })(),
      avgServeSeconds: (() => {
        const serves = todayTickets
          .filter((t) => t.status === "COMPLETED" && t.calledAt && t.completedAt)
          .map((t) => (t.completedAt!.getTime() - t.calledAt!.getTime()) / 1000);
        return serves.length ? Math.round(serves.reduce((a, b) => a + b, 0) / serves.length) : 0;
      })(),
      todayServed: todayTickets.filter((t) => t.status === "COMPLETED").length,
    };

    return NextResponse.json({ stats });
  } catch (err) {
    console.error("[GET /api/queues/[id]/stats]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
