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

  const queue = await prisma.queue.findUnique({
    where: { id: queueId, ownerId: session.user.id },
    select: { id: true, name: true, streams: { select: { id: true, name: true } } },
  });
  if (!queue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dayStart = date ? new Date(`${date}T00:00:00Z`) : new Date(new Date().setHours(0, 0, 0, 0));
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const tickets = await prisma.ticket.findMany({
    where: {
      queueId,
      createdAt: { gte: dayStart, lt: dayEnd },
    },
    include: {
      stream: { select: { id: true, name: true } },
      staffSession: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  const total = tickets.length;
  const completed = tickets.filter((t) => t.status === "COMPLETED").length;
  const absent = tickets.filter((t) => t.status === "ABSENT").length;
  const waiting = tickets.filter((t) => t.status === "WAITING" || t.status === "CALLED").length;

  const waitTimes = tickets
    .filter((t) => t.calledAt)
    .map((t) => (t.calledAt!.getTime() - t.createdAt.getTime()) / 1000);

  const serviceTimes = tickets
    .filter((t) => t.servedAt && t.completedAt)
    .map((t) => (t.completedAt!.getTime() - t.servedAt!.getTime()) / 1000);

  const avg = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  // Per-stream breakdown
  const byStream = queue.streams.map((s) => {
    const st = tickets.filter((t) => t.stream.id === s.id);
    return {
      streamId: s.id,
      streamName: s.name,
      total: st.length,
      completed: st.filter((t) => t.status === "COMPLETED").length,
      absent: st.filter((t) => t.status === "ABSENT").length,
    };
  });

  // Per-staff breakdown
  const staffMap = new Map<string, { name: string; served: number; totalServiceSeconds: number }>();
  for (const t of tickets.filter((t) => t.staffSession)) {
    const key = t.staffSession!.userId;
    const name = t.staffSession!.user.name ?? t.staffSession!.user.email ?? key;
    const existing = staffMap.get(key) ?? { name, served: 0, totalServiceSeconds: 0 };
    existing.served++;
    if (t.servedAt && t.completedAt) {
      existing.totalServiceSeconds += (t.completedAt.getTime() - t.servedAt.getTime()) / 1000;
    }
    staffMap.set(key, existing);
  }

  return NextResponse.json({
    date: date ?? dayStart.toISOString().split("T")[0],
    queue: queue.name,
    summary: {
      total,
      completed,
      absent,
      waiting,
      avgWaitSeconds: avg(waitTimes),
      avgServiceSeconds: avg(serviceTimes),
    },
    byStream,
    byStaff: Array.from(staffMap.values()),
  });
}
