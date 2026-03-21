import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public stats endpoint — no auth required
// Used by display board and customer-facing pages
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const queue = await prisma.queue.findUnique({
    where: { id },
    select: { id: true, name: true, status: true, logoUrl: true },
  });

  if (!queue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const streamStats = await prisma.stream.findMany({
    where: { queueId: id },
    include: {
      tickets: {
        where: { status: { in: ["WAITING", "CALLED", "SERVING"] } },
        select: { status: true },
      },
    },
    orderBy: { order: "asc" },
  });

  const stats = {
    queue,
    streams: streamStats.map((s) => ({
      id: s.id,
      name: s.name,
      waiting: s.tickets.filter((t) => t.status === "WAITING").length,
      called: s.tickets.filter((t) => t.status === "CALLED").length,
      serving: s.tickets.filter((t) => t.status === "SERVING").length,
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
}
