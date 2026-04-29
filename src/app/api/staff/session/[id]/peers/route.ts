import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffUser } from "@/lib/get-staff-user";
import { ok } from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getStaffUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sessionId } = await params;

  const currentSession = await prisma.staffSession.findUnique({
    where: { id: sessionId, userId: user.id, status: "ACTIVE" },
    select: { queueId: true },
  });
  if (!currentSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const peers = await prisma.staffSession.findMany({
    where: { queueId: currentSession.queueId, status: "ACTIVE", id: { not: sessionId } },
    include: {
      counter: { select: { name: true } },
    },
    orderBy: { startAt: "asc" },
  });

  const sessions = peers.map((p) => ({
    id: p.id,
    counterName: p.counter.name,
    servedCount: p.servedCount,
  }));

  return ok({ sessions });
}
