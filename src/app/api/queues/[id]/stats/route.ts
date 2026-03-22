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
    const [queue, streamStats, activeSessions] = await Promise.all([
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
    };

    return NextResponse.json({ stats });
  } catch (err) {
    console.error("[GET /api/queues/[id]/stats]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
