import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const now = new Date();
  const isCurrentlyPaused = staffSession.status === "PAUSED";

  const updated = await prisma.staffSession.update({
    where: { id },
    data: {
      status: isCurrentlyPaused ? "ACTIVE" : "PAUSED",
      pausedAt: isCurrentlyPaused ? null : now,
    },
  });

  return NextResponse.json({ session: updated });
}
