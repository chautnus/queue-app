import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastToQueue } from "@/lib/sse";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const staffSession = await prisma.staffSession.findUnique({
    where: { id, userId: session.user.id },
  });

  if (!staffSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Mark CALLED ticket as ABSENT
  const updated = await prisma.ticket.updateMany({
    where: {
      staffSessionId: id,
      status: "CALLED",
    },
    data: { status: "ABSENT" },
  });

  if (updated.count > 0) {
    broadcastToQueue(staffSession.queueId, {
      type: "ticket:absent",
      data: {},
    });
  }

  return NextResponse.json({ success: true });
}
