import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const queueId = searchParams.get("queueId");
  const date = searchParams.get("date"); // "YYYY-MM-DD"

  if (!queueId) {
    return NextResponse.json({ error: "queueId required" }, { status: 400 });
  }

  // Verify ownership
  const queue = await prisma.queue.findUnique({
    where: { id: queueId, ownerId: session.user.id },
    select: { id: true, name: true, timezone: true },
  });
  if (!queue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Build date filter
  const dayStart = date ? new Date(`${date}T00:00:00Z`) : new Date(new Date().setHours(0, 0, 0, 0));
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const tickets = await prisma.ticket.findMany({
    where: {
      queueId,
      status: { in: ["COMPLETED", "ABSENT"] },
      createdAt: { gte: dayStart, lt: dayEnd },
    },
    include: {
      stream: { select: { name: true } },
      staffSession: {
        include: {
          user: { select: { name: true, email: true } },
          counter: { select: { name: true } },
        },
      },
    },
    orderBy: { completedAt: "asc" },
  });

  const data = tickets.map((t) => ({
    id: t.id,
    displayNumber: t.displayNumber,
    stream: t.stream?.name ?? "",
    status: t.status,
    createdAt: t.createdAt,
    calledAt: t.calledAt,
    completedAt: t.completedAt,
    waitSeconds: t.calledAt
      ? Math.round((t.calledAt.getTime() - t.createdAt.getTime()) / 1000)
      : null,
    serviceSeconds:
      t.servedAt && t.completedAt
        ? Math.round((t.completedAt.getTime() - t.servedAt.getTime()) / 1000)
        : null,
    staff: t.staffSession
      ? {
          name: t.staffSession.user.name ?? t.staffSession.user.email,
          counter: t.staffSession.counter.name,
        }
      : null,
  }));

  return NextResponse.json({ queue: queue.name, date: date ?? "today", tickets: data });
}
